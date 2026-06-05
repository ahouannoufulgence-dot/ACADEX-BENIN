'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Track initialization state to prevent multiple attempts across HMR (Hot Module Replacement)
let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let persistenceStarted = false;

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  // Return cached instances if they exist (HMR friendly for Next.js)
  if (firebaseAppInstance && firestoreInstance && authInstance) {
    return { firebaseApp: firebaseAppInstance, firestore: firestoreInstance, auth: authInstance };
  }

  firebaseAppInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firestoreInstance = getFirestore(firebaseAppInstance);
  authInstance = getAuth(firebaseAppInstance);

  // Enable persistence only on the client and only once per session
  if (typeof window !== 'undefined' && !persistenceStarted) {
    persistenceStarted = true;
    
    // Use multi-tab persistence for better reliability in modern browsers
    enableMultiTabIndexedDbPersistence(firestoreInstance).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence: Plusieurs onglets ouverts. Cache activé en mode restreint.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence: Ce navigateur ne supporte pas la persistance des données.');
      } else {
        // Silently catch "already started" or other non-critical errors to prevent app crash
        console.warn('Firestore persistence info:', err.message);
      }
    });
  }

  return { firebaseApp: firebaseAppInstance, firestore: firestoreInstance, auth: authInstance };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
