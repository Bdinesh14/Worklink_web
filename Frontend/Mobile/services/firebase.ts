import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUDqFMFgnjQv5qeXuo-mbjWRJL__c_08g",
  authDomain: "work-link-fd090.firebaseapp.com",
  projectId: "work-link-fd090",
  storageBucket: "work-link-fd090.firebasestorage.app",
  messagingSenderId: "214054433844",
  appId: "1:214054433844:web:4e7832eb6557a561de8661",
  measurementId: "G-K3JBJ41GH1",
  // Correct regional database URL (Asia Southeast 1 - Singapore)
  databaseURL: "https://work-link-fd090-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase App only once (guard against hot-reload re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth only once — if already initialized, use getAuth() to avoid auth/already-initialized error
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  // auth/already-initialized — reuse existing auth instance
  auth = getAuth(app);
}

// Initialize Firebase Realtime Database with explicit regional URL
const database = getDatabase(app, "https://work-link-fd090-default-rtdb.asia-southeast1.firebasedatabase.app");

export { app, auth, database };
