import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Semua nilai berikut diambil dari file .env (lihat .env.example)
// Didapat dari: Firebase Console > Project Settings > General > Your apps > SDK setup
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Hanya Firestore yang digunakan di sisi client.
// Cloud Functions TIDAK diinisialisasi di client — penulisan dokumen baru
// selalu langsung lewat addDoc() dari modul firebase/firestore (lihat App.jsx).
export const db = getFirestore(app);
