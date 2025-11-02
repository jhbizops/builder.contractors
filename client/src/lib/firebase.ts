import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "elyment-partner-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "elyment-partner-platform",
  storageBucket: "elyment-partner-platform.firebasestorage.app",
  messagingSenderId: "165925489850",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:165925489850:web:7eaeac9d234df7e6640683",
  measurementId: "G-HEN1V6W8SE"
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);
} else if (typeof window !== "undefined") {
  console.warn(
    "Firebase credentials are missing. Falling back to local authentication for this session.",
  );
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export default app;
