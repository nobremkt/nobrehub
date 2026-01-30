/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONFIGURAÇÃO: FIREBASE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Configuração do Firebase (Auth, Firestore, Realtime, Storage).
 * As credenciais devem vir de variáveis de ambiente.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Inicializa Firebase apenas uma vez
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let realtimeDb: Database;
let storage: FirebaseStorage;

export function initFirebase() {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);

    return { app, auth, db, realtimeDb, storage };
}

export function getFirebaseAuth(): Auth {
    if (!auth) initFirebase();
    return auth;
}

export function getFirestoreDb(): Firestore {
    if (!db) initFirebase();
    return db;
}

export function getRealtimeDb(): Database {
    if (!realtimeDb) initFirebase();
    return realtimeDb;
}

export function getFirebaseStorage(): FirebaseStorage {
    if (!storage) initFirebase();
    return storage;
}

export { app, auth, db, realtimeDb, storage };

