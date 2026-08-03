/**
 * firebaseAdapter.js
 * ============================================================
 * Adapter Firebase — interface identik dengan syncService (api.js) lama.
 *
 * Strategi file:
 *   - Jika field berisi Base64 Data URL ("data:...") → upload ke Firebase Storage,
 *     ganti dengan URL Storage di Firestore.
 *   - Jika field sudah berupa URL http/https → simpan langsung ke Firestore.
 *   - Tidak ada kompresi sama sekali.
 * ============================================================
 */

import {
  fetchAllData,
  saveSettings,
  saveDocumentsBatch,
  uploadBase64ToStorage,
  getDocId,
} from './firestoreService';

// ============================================================
// Helper: programId dari localStorage
// ============================================================
const getProgramId = () => {
  const prefix = window.localStorage.getItem('active_program_prefix') || 'revit';
  return prefix === 'revitpaud' ? 'revitpaud2026' : 'revitsd2026';
};

// ============================================================
// Helper: jika field Base64 → upload ke Storage, return URL
// ============================================================
const resolveFileField = async (programId, collection, docId, fieldName, value) => {
  if (!value || typeof value !== 'string') return value;
  // Sudah URL → langsung pakai
  if (value.startsWith('http')) return value;
  // Base64 Data URL → upload ke Storage
  if (value.startsWith('data:')) {
    const ext = value.startsWith('data:image') ? 'jpg'
              : value.startsWith('data:application/pdf') ? 'pdf'
              : 'bin';
    const path = `${collection}/${docId || 'doc'}/${fieldName}.${ext}`;
    try {
      const url = await uploadBase64ToStorage(programId, path, value);
      return url;
    } catch (err) {
      console.error(`[Adapter] Gagal upload ${path} ke Storage (Rules / Authorization):`, err.message);
      // Fallback: Kembalikan Base64 asli agar foto/file TIDAK HILANG di Firestore jika Storage belum dikonfigurasi
      return value;
    }
  }
  return value;
};

/**
 * Proses satu array dokumen: upload semua file field ke Storage
 * dan ganti nilainya dengan URL.
 */
const processFilesInDocs = async (programId, collectionName, docs, fileFields) => {
  return Promise.all(
    docs.map(async (doc) => {
      const updated = { ...doc };
      const docId = getDocId(doc);
      for (const field of fileFields) {
        if (updated[field]) {
          updated[field] = await resolveFileField(
            programId, collectionName, docId, field, updated[field]
          );
        }
      }
      return updated;
    })
  );
};

// ============================================================
// Normalize data Firestore → format React state
// ============================================================
const normalizeRemoteData = (raw) => {
  const {
    settings = {},
    users = [], schools = [], contacts = [], tasks = [], trips = [],
    logs = [], reports = [], duty_reports = [], expenses = [], payments = [],
    school_docs = [], personnel_docs = [], meetings = [], meeting_docs = [],
    meeting_photos = [], trip_docs = [], activity_logs = [], kendala = [],
    kendala_comments = [], kendala_docs = [], warnings = [], weekly_progress = [],
  } = raw;

  const strip = (arr) => arr.map(({ _updatedAt, ...rest }) => rest);

  const cleanMeetings = strip(meetings).map(m => ({
    ...m,
    pesertaIds: Array.isArray(m.pesertaIds)
      ? m.pesertaIds
      : (m.pesertaIds ? String(m.pesertaIds).split(',').filter(Boolean) : []),
  }));

  const cleanActivityLogs = strip(activity_logs).map(l => {
    if (l.fileRef_id && !l.fileRef) {
      l.fileRef = {
        id: l.fileRef_id, type: l.fileRef_type || '',
        fileName: l.fileRef_fileName || '', fileData: l.fileRef_fileData || ''
      };
      delete l.fileRef_id; delete l.fileRef_type;
      delete l.fileRef_fileName; delete l.fileRef_fileData;
    }
    return l;
  });

  const cleanWarnings = strip(warnings).map(w => ({
    ...w, dismissed: w.dismissed === true || w.dismissed === 'true',
  }));

  const { _updatedAt: _s, ...cleanSettings } = settings;

  return {
    settings: cleanSettings,
    users: strip(users), schools: strip(schools), contacts: strip(contacts),
    tasks: strip(tasks), trips: strip(trips), logs: strip(logs),
    reports: strip(reports), duty_reports: strip(duty_reports),
    expenses: strip(expenses), payments: strip(payments),
    school_docs: strip(school_docs), personnel_docs: strip(personnel_docs),
    meetings: cleanMeetings, meeting_docs: strip(meeting_docs),
    meeting_photos: strip(meeting_photos),
    trip_docs: strip(trip_docs), activity_logs: cleanActivityLogs,
    kendala: strip(kendala), kendala_comments: strip(kendala_comments),
    kendala_docs: strip(kendala_docs), warnings: cleanWarnings,
    weekly_progress: strip(weekly_progress),
  };
};

// ============================================================
// MAIN ADAPTER
// ============================================================
export const syncService = {
  isConfigured() {
    return !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  },

  async fetchData() {
    const programId = getProgramId();
    const raw = await fetchAllData(programId);
    return normalizeRemoteData(raw);
  },

  async pushData(state, dirtyTables = {}) {
    const programId = getProgramId();
    const isDirty = (t) =>
      !dirtyTables || !Object.keys(dirtyTables).length
        ? true
        : dirtyTables[t] !== false;

    const tasks = [];

    if (isDirty('settings') && state.settings)
      tasks.push(saveSettings(programId, state.settings));

    if (isDirty('users') && Array.isArray(state.users))
      tasks.push(saveDocumentsBatch(programId, 'users', state.users));

    if (isDirty('schools') && Array.isArray(state.schools))
      tasks.push(
        processFilesInDocs(programId, 'schools', state.schools, ['foto_banner'])
          .then(d => saveDocumentsBatch(programId, 'schools', d))
      );

    if (isDirty('contacts') && Array.isArray(state.contacts))
      tasks.push(saveDocumentsBatch(programId, 'contacts', state.contacts));

    if (isDirty('tasks') && Array.isArray(state.tasks))
      tasks.push(saveDocumentsBatch(programId, 'tasks',
        state.tasks.map(t => ({
          ...t,
          sekolahId: t.sekolahId || t.schoolId || '',
          schoolId: t.sekolahId || t.schoolId || '',
        }))
      ));

    if (isDirty('trips') && Array.isArray(state.trips))
      tasks.push(saveDocumentsBatch(programId, 'trips', state.trips));

    if (isDirty('logs') && Array.isArray(state.logs)) {
      const realLogs = state.logs.filter(l => !l.id?.startsWith('log-meeting-'));
      tasks.push(
        processFilesInDocs(programId, 'logs', realLogs, ['foto', 'photoBase64'])
          .then(d => saveDocumentsBatch(programId, 'logs', d))
      );
    }

    if (isDirty('reports') && Array.isArray(state.reports))
      tasks.push(
        processFilesInDocs(programId, 'reports', state.reports, ['fileData', 'base64Data'])
          .then(d => saveDocumentsBatch(programId, 'reports', d))
      );

    if (isDirty('duty_reports') && Array.isArray(state.dutyReports))
      tasks.push(saveDocumentsBatch(programId, 'duty_reports', state.dutyReports));

    if (isDirty('expenses') && Array.isArray(state.expenses))
      tasks.push(saveDocumentsBatch(programId, 'expenses', state.expenses));

    if (isDirty('payments') && Array.isArray(state.payments))
      tasks.push(saveDocumentsBatch(programId, 'payments', state.payments));

    if (isDirty('school_docs') && Array.isArray(state.schoolDocs))
      tasks.push(
        processFilesInDocs(programId, 'school_docs', state.schoolDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'school_docs', d))
      );

    if (isDirty('personnel_docs') && Array.isArray(state.personnelDocs))
      tasks.push(
        processFilesInDocs(programId, 'personnel_docs', state.personnelDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'personnel_docs', d))
      );

    if (isDirty('meetings') && Array.isArray(state.meetings)) {
      const norm = state.meetings.map(m => ({
        ...m,
        pesertaIds: Array.isArray(m.pesertaIds) ? m.pesertaIds : [],
      }));
      tasks.push(
        processFilesInDocs(programId, 'meetings', norm, ['fotoKegiatan'])
          .then(d => saveDocumentsBatch(programId, 'meetings', d))
      );
    }

    if (isDirty('meeting_docs') && Array.isArray(state.meetingDocs))
      tasks.push(
        processFilesInDocs(programId, 'meeting_docs', state.meetingDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'meeting_docs', d))
      );

    if (isDirty('meeting_photos') && Array.isArray(state.meetingPhotos))
      tasks.push(
        processFilesInDocs(programId, 'meeting_photos', state.meetingPhotos, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'meeting_photos', d))
      );

    if (isDirty('trip_docs') && Array.isArray(state.tripDocs))
      tasks.push(
        processFilesInDocs(programId, 'trip_docs', state.tripDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'trip_docs', d))
      );

    if (isDirty('activity_logs') && Array.isArray(state.activityLogs)) {
      const real = state.activityLogs
        .filter(l => l && !l.id?.startsWith('act-meeting-'))
        .slice(0, 100);
      tasks.push(saveDocumentsBatch(programId, 'activity_logs', real));
    }

    if (isDirty('kendala') && Array.isArray(state.kendala))
      tasks.push(saveDocumentsBatch(programId, 'kendala', state.kendala));

    if (isDirty('kendala_comments') && Array.isArray(state.kendalaComments))
      tasks.push(saveDocumentsBatch(programId, 'kendala_comments', state.kendalaComments));

    if (isDirty('kendala_docs') && Array.isArray(state.kendalaDocs))
      tasks.push(
        processFilesInDocs(programId, 'kendala_docs', state.kendalaDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'kendala_docs', d))
      );

    if (isDirty('warnings') && Array.isArray(state.warnings))
      tasks.push(saveDocumentsBatch(programId, 'warnings', state.warnings));

    if (isDirty('weekly_progress') && Array.isArray(state.weeklyProgress))
      tasks.push(saveDocumentsBatch(programId, 'weekly_progress', state.weeklyProgress));

    await Promise.all(tasks);
    console.log('[Firebase Adapter] ✓ pushData selesai');
    return { message: 'Data berhasil disimpan ke Firebase.' };
  },
};

export { seedInitialData, checkFirestoreConnection } from './firestoreService';
