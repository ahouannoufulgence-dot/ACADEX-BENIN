'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  if (firebaseAppInstance && firestoreInstance && authInstance) {
    return { firebaseApp: firebaseAppInstance, firestore: firestoreInstance, auth: authInstance };
  }
  firebaseAppInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firestoreInstance = initializeFirestore(firebaseAppInstance, {
    experimentalForceLongPolling: true,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  });
  authInstance = getAuth(firebaseAppInstance);
  return { firebaseApp: firebaseAppInstance, firestore: firestoreInstance, auth: authInstance };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
