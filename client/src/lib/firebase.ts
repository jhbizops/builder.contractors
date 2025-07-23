import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "GOOGLE_API_KEY",
  authDomain: "elyment-partner-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "elyment-partner-platform",
  storageBucket: "elyment-partner-platform.firebasestorage.app",
  messagingSenderId: "165925489850",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:165925489850:web:7eaeac9d234df7e6640683",
  measurementId: "G-HEN1V6W8SE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
