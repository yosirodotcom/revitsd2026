/**
 * firestoreService.js
 * ============================================================
 * Service layer untuk semua operasi Firestore & Firebase Storage.
 *
 * Strategi penyimpanan:
 *   - Foto & dokumen (PDF, dll.) → Firebase Storage (tanpa kompresi)
 *   - Semua data struktural → Firestore
 *
 * Pola koleksi: /programs/{programId}/{collectionName}/{docId}
 * Settings     : /programs/{programId}/meta/settings
 * Storage path : programs/{programId}/{collectionName}/{docId}/{fieldName}
 * ============================================================
 */

import {
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, programCollection, programDoc, settingsDoc } from './firebase';

// ============================================================
// Daftar semua koleksi data operasional
// ============================================================
export const COLLECTIONS = [
  'users',
  'schools',
  'contacts',
  'tasks',
  'trips',
  'logs',
  'reports',
  'duty_reports',
  'expenses',
  'payments',
  'school_docs',
  'personnel_docs',
  'meetings',
  'meeting_docs',
  'meeting_photos',
  'trip_docs',
  'activity_logs',
  'kendala',
  'kendala_comments',
  'kendala_docs',
  'warnings',
];

// ============================================================
// Helper: ambil semua dokumen dari satu koleksi → Array
// ============================================================
const fetchCollection = async (programId, collectionName) => {
  const colRef = programCollection(programId, collectionName);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ============================================================
// 1. Fetch semua data sekaligus (saat startup)
// ============================================================
export const fetchAllData = async (programId) => {
  console.log(`[Firestore] Mengambil semua data: ${programId}`);

  const [settingsSnap, ...collections] = await Promise.all([
    getDoc(settingsDoc(programId)),
    ...COLLECTIONS.map((col) => fetchCollection(programId, col)),
  ]);

  const result = { settings: settingsSnap.exists() ? settingsSnap.data() : {} };
  COLLECTIONS.forEach((col, i) => { result[col] = collections[i]; });

  console.log(`[Firestore] ✓ Data diambil:`,
    Object.keys(result).map(k => `${k}:${Array.isArray(result[k]) ? result[k].length : 1}`).join(' ')
  );
  return result;
};

const getDocId = (doc) => {
  if (!doc) return '';
  return String(doc.id || doc.npsn || doc.userId || '').trim();
};

/**
 * Helper: membersihkan payload dokumen dari nilai `undefined`
 * agar aman disimpan ke Firestore tanpa menggagalkan write batch.
 */
export const sanitizeFirestorePayload = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeFirestorePayload);
  const clean = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        clean[key] = sanitizeFirestorePayload(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
};

// ============================================================
// 2. Simpan / Update satu dokumen
// ============================================================
export const saveDocument = async (programId, collectionName, docData) => {
  const docId = getDocId(docData);
  if (!docId) throw new Error(`saveDocument: dokumen tanpa 'id' atau 'npsn' (${collectionName})`);
  const docRef = programDoc(programId, collectionName, docId);
  const sanitized = sanitizeFirestorePayload(docData);
  const payload = { id: docId, ...sanitized, _updatedAt: serverTimestamp() };
  await setDoc(docRef, payload, { merge: true });
};

// ============================================================
// 3. Simpan banyak dokumen sekaligus (batch write, auto-chunk)
// allowDelete: default false (UPSERT ONLY). Mencegah penghapusan tak sengaja dari background sync.
// ============================================================
export const saveDocumentsBatch = async (programId, collectionName, docs, allowDelete = false) => {
  const safeDocs = Array.isArray(docs) ? docs : [];
  const CHUNK_SIZE = 400;
  
  // 1. Batch delete removed docs ONLY if allowDelete is explicitly true
  if (allowDelete) {
    let existingDocIds = [];
    try {
      const colRef = programCollection(programId, collectionName);
      const snapshot = await getDocs(colRef);
      existingDocIds = snapshot.docs.map(d => d.id);
    } catch (err) {
      console.warn(`[Firestore] Failed to read existing doc IDs for ${collectionName}:`, err.message);
    }

    const newIds = new Set(safeDocs.map(d => getDocId(d)).filter(Boolean));
    const idsToDelete = existingDocIds.filter(id => !newIds.has(id));

    if (idsToDelete.length > 0) {
      for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
        const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(id => {
          batch.delete(programDoc(programId, collectionName, id));
        });
        await batch.commit();
        console.log(`[Firestore] ✗ Deleted ${chunk.length} removed docs from ${collectionName}`);
      }
    }
  }

  // 2. Batch set/update current docs in Firestore (UPSERT)
  if (safeDocs.length > 0) {
    for (let i = 0; i < safeDocs.length; i += CHUNK_SIZE) {
      const chunk = safeDocs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((docData) => {
        const docId = getDocId(docData);
        if (!docId) return;
        const docRef = programDoc(programId, collectionName, docId);
        const sanitized = sanitizeFirestorePayload(docData);
        const payload = { id: docId, ...sanitized, _updatedAt: serverTimestamp() };
        batch.set(docRef, payload, { merge: true });
      });
      await batch.commit();
      console.log(`[Firestore] ✓ Batch ${collectionName} chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${chunk.length} docs`);
    }
  }
};

// ============================================================
// 4. Hapus satu dokumen
// ============================================================
export const deleteDocument = async (programId, collectionName, docId) => {
  const docRef = programDoc(programId, collectionName, String(docId));
  await deleteDoc(docRef);
  console.log(`[Firestore] ✗ Deleted ${collectionName}/${docId}`);
};

// ============================================================
// 5. Simpan Settings
// ============================================================
export const saveSettings = async (programId, settingsData) => {
  const ref = settingsDoc(programId);
  const { simulatedToday, ...toSave } = settingsData;
  await setDoc(ref, { ...toSave, _updatedAt: serverTimestamp() }, { merge: true });
};

// ============================================================
// 6. Upload File ke Firebase Storage (TANPA KOMPRESI)
// ============================================================

/**
 * Upload File atau Blob langsung ke Firebase Storage.
 * Tidak ada kompresi — file disimpan apa adanya.
 *
 * @param {string} programId
 * @param {string} storagePath - path relatif, e.g. "logs/log123/foto"
 * @param {File|Blob} file
 * @param {function} [onProgress] - callback(0-100) opsional
 * @returns {Promise<string>} download URL
 */
export const uploadFileToStorage = async (programId, storagePath, file, onProgress) => {
  const fullPath = `programs/${programId}/${storagePath}`;
  const fileRef = storageRef(storage, fullPath);

  if (onProgress) onProgress(10);

  // Langsung upload — tidak ada resize/kompresi sama sekali
  await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalName: file.name || '',
      programId,
    },
  });

  if (onProgress) onProgress(80);

  const url = await getDownloadURL(fileRef);

  if (onProgress) onProgress(100);
  console.log(`[Storage] ✓ Uploaded ${fullPath} (${(file.size / 1024).toFixed(0)}KB)`);
  return url;
};

/**
 * Upload Base64 Data URL ke Firebase Storage.
 * Digunakan saat migrasi data lama yang masih Base64.
 *
 * @param {string} programId
 * @param {string} storagePath
 * @param {string} base64DataUrl - "data:image/jpeg;base64,..."
 * @returns {Promise<string>} download URL
 */
export const uploadBase64ToStorage = async (programId, storagePath, base64DataUrl) => {
  const fullPath = `programs/${programId}/${storagePath}`;
  const fileRef = storageRef(storage, fullPath);

  // Pisah header dan data
  const [header, data] = base64DataUrl.split(',');
  const contentType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';

  await uploadString(fileRef, data, 'base64', { contentType });
  const url = await getDownloadURL(fileRef);
  console.log(`[Storage] ✓ Uploaded Base64 → ${fullPath}`);
  return url;
};

/**
 * Hapus file dari Firebase Storage.
 * @param {string} fullPath - path lengkap di Storage (termasuk "programs/...")
 */
export const deleteFileFromStorage = async (fullPath) => {
  try {
    const fileRef = storageRef(storage, fullPath);
    await deleteObject(fileRef);
    console.log(`[Storage] ✗ Deleted ${fullPath}`);
  } catch (err) {
    console.warn(`[Storage] File tidak ditemukan atau gagal dihapus:`, err.message);
  }
};

// ============================================================
// 7. Real-time listener (opsional)
// ============================================================
export const subscribeToCollection = (programId, collectionName, callback) => {
  const colRef = programCollection(programId, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ============================================================
// 8. Seed data awal ke Firestore (satu kali)
// ============================================================
export const seedInitialData = async (programId, initialState) => {
  console.log(`[Firestore] Cek seeding untuk ${programId}...`);
  const usersSnap = await getDocs(programCollection(programId, 'users'));
  if (!usersSnap.empty) {
    console.log(`[Firestore] Data sudah ada (${usersSnap.size} users), skip.`);
    return false;
  }
  console.log(`[Firestore] Kosong — mulai seeding...`);
  if (initialState.settings) await saveSettings(programId, initialState.settings);
  for (const col of COLLECTIONS) {
    const data = initialState[col];
    if (data?.length) await saveDocumentsBatch(programId, col, data);
  }
  console.log(`[Firestore] ✓ Seeding selesai: ${programId}`);
  return true;
};

// ============================================================
// 9. Cek koneksi Firebase
// ============================================================
export const checkFirestoreConnection = async () => {
  try {
    await getDoc(programDoc('__ping__', 'ping', 'ping'));
    return true;
  } catch (err) {
    if (['not-found', 'permission-denied'].includes(err.code)) return true;
    console.error('[Firestore] Koneksi gagal:', err);
    return false;
  }
};
