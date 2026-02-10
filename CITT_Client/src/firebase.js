import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Your Firebase configuration
// Get these values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBmj3AY9Z1vtaytaiFJ0tG0Fuu5svMPhIA",
  authDomain: "citt-cfecd.firebaseapp.com",
  projectId: "citt-cfecd",
  storageBucket: "citt-cfecd.firebasestorage.app",
  messagingSenderId: "734252860027",
  appId: "1:734252860027:web:828fe9e5ce7aad5b3e58de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);        // <-- Firestore database
export const storage = getStorage(app);  // <-- Firebase Storage
export default app;