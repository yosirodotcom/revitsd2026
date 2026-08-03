/**
 * Firebase initialization & exports
 * Menggunakan Firestore + Firebase Storage (Blaze Plan diperlukan untuk Storage).
 */
import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore, collection, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

/** Firestore instance dengan penanganan ignoreUndefinedProperties */
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

/** Firebase Storage instance */
export const storage = getStorage(app);

/**
 * Reference ke sub-collection di bawah sebuah program.
 * Struktur: /programs/{programId}/{collectionName}
 */
export const programCollection = (programId, collectionName) =>
  collection(db, 'programs', programId, collectionName);

/**
 * Reference ke dokumen tunggal di bawah sebuah program.
 */
export const programDoc = (programId, collectionName, docId) =>
  doc(db, 'programs', programId, collectionName, docId);

/**
 * Reference ke dokumen settings (singleton per program).
 * Disimpan sebagai: /programs/{programId}/meta/settings
 */
export const settingsDoc = (programId) =>
  doc(db, 'programs', programId, 'meta', 'settings');
