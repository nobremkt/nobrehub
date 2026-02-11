/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONFIGURAÇÃO: FIREBASE (Apenas Storage)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Após a migração para Supabase, o Firebase é usado APENAS para Storage.
 * Auth, Firestore e Realtime Database foram completamente migrados.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializa Firebase apenas uma vez (necessário para Storage)
let app: FirebaseApp;
let storage: FirebaseStorage;

export function initFirebase() {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    storage = getStorage(app);

    return { app, storage };
}

export function getFirebaseStorage(): FirebaseStorage {
    if (!storage) initFirebase();
    return storage;
}

export { app, storage };
