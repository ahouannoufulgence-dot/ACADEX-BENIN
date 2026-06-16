'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  enableMultiTabIndexedDbPersistence, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';
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

  // Activation de la persistance hors-ligne en mode multi-onglets
  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(firestoreInstance).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Plusieurs onglets ouverts, persistance active dans un seul.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence: Ce navigateur ne supporte pas la persistance des données.');
      }
    });
  }

  return { firebaseApp: firebaseAppInstance, firestore: firestoreInstance, auth: authInstance };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
