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

// Track initialization state to prevent multiple attempts across HMR
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
  
  // Utilisation de initializeFirestore avec experimentalForceLongPolling pour une stabilité maximale
  // dans l'environnement de développement Firebase Studio.
  firestoreInstance = initializeFirestore(firebaseAppInstance, {
    experimentalForceLongPolling: true,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  });

  authInstance = getAuth(firebaseAppInstance);

  // Enable persistence only on the client and only once per session
  if (typeof window !== 'undefined' && !persistenceStarted) {
    persistenceStarted = true;
    
    enableMultiTabIndexedDbPersistence(firestoreInstance).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Plusieurs onglets ouverts. Cache activé en mode restreint.');
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
