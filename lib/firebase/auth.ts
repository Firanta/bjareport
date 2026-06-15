// =============================================================
// BJA Report — Firebase Auth Service
// =============================================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  onIdTokenChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

export async function loginWithEmail(
  email: string,
  password: string,
  rememberMe: boolean = true
) {
  const authInstance = getFirebaseAuth();
  const persistence = rememberMe
    ? browserLocalPersistence
    : browserSessionPersistence;
  await setPersistence(authInstance, persistence);
  return signInWithEmailAndPassword(authInstance, email, password);
}

export async function logout() {
  return signOut(getFirebaseAuth());
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function onTokenChange(callback: (user: User | null) => void) {
  return onIdTokenChanged(getFirebaseAuth(), callback);
}
