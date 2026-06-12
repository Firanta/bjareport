// =============================================================
// BJA Report — Firebase Configuration (Lazy Init)
// =============================================================
// Firebase is browser-only — only initialize on client side.
// =============================================================

import { getApps, initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Lazy singletons — only initialized when accessed
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error(
      "Firebase configuration is missing. Please create .env.local from .env.example and fill in your Firebase project details."
    );
  }
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

// Convenience exports (alias)
export const auth = {
  get current() { return getFirebaseAuth(); }
};

export const db = {
  get current() { return getFirebaseDb(); }
};

export default firebaseConfig;
