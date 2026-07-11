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
    const path = `${collection}/${docId}/${fieldName}.${ext}`;
    try {
      const url = await uploadBase64ToStorage(programId, path, value);
      return url;
    } catch (err) {
      console.error(`[Adapter] Gagal upload ${path}:`, err.message);
      return ''; // Jangan simpan Base64 raksasa ke Firestore jika upload gagal
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
      for (const field of fileFields) {
        if (updated[field]) {
          updated[field] = await resolveFileField(
            programId, collectionName, doc.id, field, updated[field]
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
    trip_docs = [], activity_logs = [], kendala = [], kendala_comments = [],
    kendala_docs = [], warnings = [],
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
    trip_docs: strip(trip_docs), activity_logs: cleanActivityLogs,
    kendala: strip(kendala), kendala_comments: strip(kendala_comments),
    kendala_docs: strip(kendala_docs), warnings: cleanWarnings,
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

    if (isDirty('users') && state.users?.length)
      tasks.push(saveDocumentsBatch(programId, 'users', state.users));

    if (isDirty('schools') && state.schools?.length)
      tasks.push(
        processFilesInDocs(programId, 'schools', state.schools, ['foto_banner'])
          .then(d => saveDocumentsBatch(programId, 'schools', d))
      );

    if (isDirty('contacts') && state.contacts?.length)
      tasks.push(saveDocumentsBatch(programId, 'contacts', state.contacts));

    if (isDirty('tasks') && state.tasks?.length)
      tasks.push(saveDocumentsBatch(programId, 'tasks',
        state.tasks.map(t => ({
          ...t,
          sekolahId: t.sekolahId || t.schoolId || '',
          schoolId: t.sekolahId || t.schoolId || '',
        }))
      ));

    if (isDirty('trips') && state.trips?.length)
      tasks.push(saveDocumentsBatch(programId, 'trips', state.trips));

    if (isDirty('logs') && state.logs?.length) {
      const realLogs = state.logs.filter(l => !l.id?.startsWith('log-meeting-'));
      if (realLogs.length)
        tasks.push(
          processFilesInDocs(programId, 'logs', realLogs, ['foto', 'photoBase64'])
            .then(d => saveDocumentsBatch(programId, 'logs', d))
        );
    }

    if (isDirty('reports') && state.reports?.length)
      tasks.push(
        processFilesInDocs(programId, 'reports', state.reports, ['fileData', 'base64Data'])
          .then(d => saveDocumentsBatch(programId, 'reports', d))
      );

    if (isDirty('duty_reports') && state.dutyReports?.length)
      tasks.push(saveDocumentsBatch(programId, 'duty_reports', state.dutyReports));

    if (isDirty('expenses') && state.expenses?.length)
      tasks.push(saveDocumentsBatch(programId, 'expenses', state.expenses));

    if (isDirty('payments') && state.payments?.length)
      tasks.push(saveDocumentsBatch(programId, 'payments', state.payments));

    if (isDirty('school_docs') && state.schoolDocs?.length)
      tasks.push(
        processFilesInDocs(programId, 'school_docs', state.schoolDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'school_docs', d))
      );

    if (isDirty('personnel_docs') && state.personnelDocs?.length)
      tasks.push(
        processFilesInDocs(programId, 'personnel_docs', state.personnelDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'personnel_docs', d))
      );

    if (isDirty('meetings') && state.meetings?.length) {
      const norm = state.meetings.map(m => ({
        ...m,
        pesertaIds: Array.isArray(m.pesertaIds) ? m.pesertaIds : [],
      }));
      tasks.push(
        processFilesInDocs(programId, 'meetings', norm, ['fotoKegiatan'])
          .then(d => saveDocumentsBatch(programId, 'meetings', d))
      );
    }

    if (isDirty('meeting_docs') && state.meetingDocs?.length)
      tasks.push(
        processFilesInDocs(programId, 'meeting_docs', state.meetingDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'meeting_docs', d))
      );

    if (isDirty('trip_docs') && state.tripDocs?.length)
      tasks.push(
        processFilesInDocs(programId, 'trip_docs', state.tripDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'trip_docs', d))
      );

    if (isDirty('activity_logs') && state.activityLogs?.length) {
      const real = state.activityLogs
        .filter(l => l && !l.id?.startsWith('act-meeting-'))
        .slice(0, 100);
      if (real.length)
        tasks.push(saveDocumentsBatch(programId, 'activity_logs', real));
    }

    if (isDirty('kendala') && state.kendala?.length)
      tasks.push(saveDocumentsBatch(programId, 'kendala', state.kendala));

    if (isDirty('kendala_comments') && state.kendalaComments?.length)
      tasks.push(saveDocumentsBatch(programId, 'kendala_comments', state.kendalaComments));

    if (isDirty('kendala_docs') && state.kendalaDocs?.length)
      tasks.push(
        processFilesInDocs(programId, 'kendala_docs', state.kendalaDocs, ['fileData'])
          .then(d => saveDocumentsBatch(programId, 'kendala_docs', d))
      );

    if (isDirty('warnings') && state.warnings?.length)
      tasks.push(saveDocumentsBatch(programId, 'warnings', state.warnings));

    await Promise.all(tasks);
    console.log('[Firebase Adapter] ✓ pushData selesai');
    return { message: 'Data berhasil disimpan ke Firebase.' };
  },
};

export { seedInitialData, checkFirestoreConnection } from './firestoreService';
