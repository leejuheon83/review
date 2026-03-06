import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseClientApp } from "@/lib/firebase-client";

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  return getAuth(app);
}

export const db = getFirebaseDb();
export const auth = getFirebaseAuth();
