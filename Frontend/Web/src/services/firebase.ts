import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration — same as mobile app
const firebaseConfig = {
  apiKey: "AIzaSyBUDqFMFgnjQv5qeXuo-mbjWRJL__c_08g",
  authDomain: "work-link-fd090.firebaseapp.com",
  projectId: "work-link-fd090",
  storageBucket: "work-link-fd090.firebasestorage.app",
  messagingSenderId: "214054433844",
  appId: "1:214054433844:web:4e7832eb6557a561de8661",
  measurementId: "G-K3JBJ41GH1",
  databaseURL: "https://work-link-fd090-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase App only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with browser local persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Initialize Firebase Realtime Database
const database = getDatabase(app, "https://work-link-fd090-default-rtdb.asia-southeast1.firebasedatabase.app");

export { app, auth, database };
