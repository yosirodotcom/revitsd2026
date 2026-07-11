/**
 * migrationService.js
 * ============================================================
 * Utilitas migrasi data satu arah: Google Sheets → Firebase Firestore.
 *
 * Alur:
 * 1. Fetch semua data dari Google Sheets via Apps Script URL.
 * 2. Untuk setiap record yang mengandung Base64 foto/file:
 *    - Upload ke Firebase Storage
 *    - Ganti Base64 dengan URL Storage
 * 3. Simpan semua data ke Firestore via saveDocumentsBatch / saveSettings.
 *
 * Dijalankan SATU KALI oleh Super Admin dari MigrationTool.jsx.
 * ============================================================
 */

import {
  saveSettings,
  saveDocumentsBatch,
  uploadBase64ToStorage,
  COLLECTIONS,
} from './firestoreService';

// ============================================================
// Helper: upload field Base64 ke Storage jika perlu
// ============================================================
const resolveField = async (programId, collection, docId, fieldName, value) => {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('http')) return value; // sudah URL, langsung pakai
  if (!value.startsWith('data:')) return value; // bukan Base64, abaikan

  // Tentukan ekstensi
  const ext = value.startsWith('data:image') ? 'jpg'
    : value.startsWith('data:application/pdf') ? 'pdf'
    : 'bin';
  const path = `${collection}/${docId}/${fieldName}.${ext}`;
  try {
    const url = await uploadBase64ToStorage(programId, path, value);
    return url;
  } catch (err) {
    console.warn(`[Migration] Gagal upload ${path}:`, err.message);
    return ''; // jangan simpan Base64 besar ke Firestore
  }
};

// ============================================================
// Helper: normalize data dari Sheets ke format bersih Firestore
// ============================================================
const normalizeSheetData = (sheetData) => {
  const isValidId = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const toNum = (v) => {
    const n = Number(v); return isNaN(n) ? 0 : n;
  };

  return {
    settings: sheetData.settings || {},
    users: (sheetData.users || []).filter(u => isValidId(u.id)).map(u => ({
      ...u,
      password: u.password != null ? String(u.password).trim() : '',
      taxPct: (u.taxPct == null || String(u.taxPct).trim() === '') ? null : toNum(u.taxPct),
    })),
    schools: (sheetData.schools || []).filter(s => isValidId(s.npsn)).map(s => ({
      ...s,
      npsn: String(s.npsn).trim(),
      progres_fisik: toNum(s.progres_fisik),
      nama_sekolah: s.nama_sekolah || s.nama || '',
      kepala_sekolah: s.kepala_sekolah || s.kepalaSekolah || '',
    })),
    contacts: (sheetData.contacts || []).filter(c => isValidId(c.id)),
    tasks: (sheetData.tasks || []).filter(t => isValidId(t.id)).map(t => ({
      ...t,
      sekolahId: t.sekolahId || t.schoolId || '',
      schoolId: t.sekolahId || t.schoolId || '',
    })),
    trips: (sheetData.trips || []).filter(t => isValidId(t.id)).map(t => {
      const norm = { ...t };
      norm.sekolahId = norm.sekolahId || norm.schoolId || '';
      norm.schoolId = norm.sekolahId;
      if (norm.date && !norm.tanggalMulai) norm.tanggalMulai = norm.date;
      if (norm.duration && !norm.durasiHari) norm.durasiHari = norm.duration;
      if (!norm.tanggalSelesai) norm.tanggalSelesai = norm.tanggalMulai;
      if (!norm.kunjunganKe) norm.kunjunganKe = 1;
      if (!norm.userRoleTim) norm.userRoleTim = 'Fasilitator';
      return norm;
    }),
    logs: (sheetData.logs || []).filter(l => isValidId(l.id)).map(l => ({
      ...l,
      sekolahId: l.sekolahId || l.schoolId || '',
      schoolId: l.sekolahId || l.schoolId || '',
    })),
    reports: (sheetData.reports || []).filter(r => isValidId(r.id)).map(r => ({
      ...r,
      sekolahId: r.sekolahId || r.schoolId || '',
      schoolId: r.sekolahId || r.schoolId || '',
      status: r.status || 'pending',
      note: r.note || '',
    })),
    duty_reports: (sheetData.duty_reports || []).filter(dr => isValidId(dr.userId)),
    expenses: (sheetData.expenses || []).filter(e => isValidId(e.id)),
    payments: (sheetData.payments || []).filter(p => isValidId(p.id)),
    school_docs: (sheetData.school_docs || []).filter(d => isValidId(d.id)).map(d => ({
      ...d,
      sekolahId: d.sekolahId || d.schoolNpsn || d.schoolId || '',
    })),
    personnel_docs: (sheetData.personnel_docs || []).filter(d => isValidId(d.id)),
    meetings: (sheetData.meetings || []).filter(m => isValidId(m.id)).map(m => ({
      ...m,
      pesertaIds: typeof m.pesertaIds === 'string'
        ? (m.pesertaIds ? m.pesertaIds.split(',').filter(Boolean) : [])
        : (Array.isArray(m.pesertaIds) ? m.pesertaIds : []),
    })),
    meeting_docs: (sheetData.meeting_docs || []).filter(d => isValidId(d.id)),
    trip_docs: (sheetData.trip_docs || []).filter(d => isValidId(d.id)),
    activity_logs: (sheetData.activity_logs || []).filter(l => isValidId(l.id)).map(l => {
      if (l.fileRef_id) {
        l.fileRef = {
          id: l.fileRef_id, type: l.fileRef_type || '',
          fileName: l.fileRef_fileName || '', fileData: l.fileRef_fileData || '',
        };
        delete l.fileRef_id; delete l.fileRef_type;
        delete l.fileRef_fileName; delete l.fileRef_fileData;
      }
      return l;
    }),
    kendala: (sheetData.kendala || []).filter(k => isValidId(k.id)).map(k => ({
      ...k, schoolId: k.schoolId ? String(k.schoolId).trim() : '',
    })),
    kendala_comments: (sheetData.kendala_comments || []).filter(c => isValidId(c.id)),
    kendala_docs: (sheetData.kendala_docs || []).filter(d => isValidId(d.id)),
    warnings: (sheetData.warnings || []).filter(w => isValidId(w.id)).map(w => ({
      ...w, dismissed: w.dismissed === true || w.dismissed === 'true',
    })),
  };
};

// ============================================================
// File fields yang perlu di-resolve ke Storage per koleksi
// ============================================================
const FILE_FIELDS = {
  schools: ['foto_banner'],
  logs: ['foto', 'photoBase64'],
  reports: ['fileData', 'base64Data'],
  school_docs: ['fileData'],
  personnel_docs: ['fileData'],
  meetings: ['fotoKegiatan'],
  meeting_docs: ['fileData'],
  trip_docs: ['fileData'],
  kendala_docs: ['fileData'],
};

// ============================================================
// MAIN: runMigration
// ============================================================
/**
 * Menjalankan migrasi penuh dari Google Sheets ke Firebase.
 *
 * @param {object} options
 * @param {string} options.programId - "revitsd2026" | "revitpaud2026"
 * @param {string} options.sheetsUrl - URL Apps Script
 * @param {string} options.sheetsToken - Token keamanan
 * @param {function} options.onProgress - callback({ step, total, message, percent })
 * @param {boolean} [options.overwriteExisting=false] - Paksa timpa data yang sudah ada
 * @returns {Promise<{ success: boolean, stats: object, errors: string[] }>}
 */
export const runMigration = async ({
  programId,
  sheetsUrl,
  sheetsToken,
  onProgress,
  overwriteExisting = false,
}) => {
  const errors = [];
  const stats = {};
  const report = (step, total, message, percent) => {
    onProgress?.({ step, total, message, percent });
    console.log(`[Migration] [${step}/${total}] ${message} (${percent}%)`);
  };

  const TOTAL_STEPS = COLLECTIONS.length + 3; // settings + upload + collections
  let currentStep = 0;

  try {
    // ── STEP 1: Fetch dari Google Sheets ──
    currentStep++;
    report(currentStep, TOTAL_STEPS, 'Mengambil data dari Google Sheets...', 5);

    const fetchUrl = `${sheetsUrl}?token=${encodeURIComponent(sheetsToken)}&_t=${Date.now()}`;
    const response = await fetch(fetchUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const rawData = await response.json();
    if (rawData.error) throw new Error(rawData.error);

    report(currentStep, TOTAL_STEPS, `Data diterima dari Google Sheets.`, 10);

    // ── STEP 2: Normalize ──
    currentStep++;
    report(currentStep, TOTAL_STEPS, 'Memvalidasi & membersihkan data...', 15);
    const cleanData = normalizeSheetData(rawData);

    // ── STEP 3: Upload file ke Firebase Storage ──
    currentStep++;
    report(currentStep, TOTAL_STEPS, 'Mengupload file ke Firebase Storage...', 20);

    for (const [col, fields] of Object.entries(FILE_FIELDS)) {
      const docs = cleanData[col] || [];
      if (!docs.length) continue;
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        for (const field of fields) {
          if (doc[field]) {
            doc[field] = await resolveField(programId, col, doc.id, field, doc[field]);
          }
        }
        // Progress dalam upload
        const uploadPct = 20 + Math.round((i / docs.length) * 20);
        if (i % 5 === 0) {
          report(currentStep, TOTAL_STEPS,
            `Upload file ${col}: ${i + 1}/${docs.length}`, uploadPct);
        }
      }
    }

    // ── STEP 4+: Simpan ke Firestore per koleksi ──
    report(currentStep, TOTAL_STEPS, 'Menyimpan data ke Firestore...', 42);

    // Settings
    if (cleanData.settings && Object.keys(cleanData.settings).length > 0) {
      await saveSettings(programId, cleanData.settings);
      stats.settings = 1;
    }

    // Setiap koleksi
    for (const col of COLLECTIONS) {
      currentStep++;
      const data = cleanData[col];
      if (!data?.length) {
        stats[col] = 0;
        continue;
      }
      const pct = 42 + Math.round((currentStep / TOTAL_STEPS) * 55);
      report(currentStep, TOTAL_STEPS, `Menyimpan ${col} (${data.length} records)...`, pct);

      try {
        await saveDocumentsBatch(programId, col, data);
        stats[col] = data.length;
      } catch (err) {
        errors.push(`Gagal simpan ${col}: ${err.message}`);
        stats[col] = 0;
      }
    }

    report(TOTAL_STEPS, TOTAL_STEPS, 'Migrasi selesai!', 100);
    return { success: true, stats, errors };

  } catch (err) {
    errors.push(err.message);
    return { success: false, stats, errors };
  }
};

/**
 * Hanya fetch data dari Google Sheets tanpa menyimpan ke Firestore.
 * Berguna untuk preview sebelum migrasi.
 */
export const previewSheetData = async (sheetsUrl, sheetsToken) => {
  const fetchUrl = `${sheetsUrl}?token=${encodeURIComponent(sheetsToken)}&_t=${Date.now()}`;
  const response = await fetch(fetchUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  const clean = normalizeSheetData(data);
  return {
    users: clean.users.length,
    schools: clean.schools.length,
    contacts: clean.contacts.length,
    tasks: clean.tasks.length,
    trips: clean.trips.length,
    logs: clean.logs.length,
    reports: clean.reports.length,
    meetings: clean.meetings.length,
    expenses: clean.expenses.length,
    payments: clean.payments.length,
  };
};
