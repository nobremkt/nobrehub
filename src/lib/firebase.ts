// Firebase Configuration for Nobre Hub
// Realtime Database for instant sync (replaces Socket.io)

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVf1zkAS_ivTrJ5Vopzhx6yA6BgMl4Oas",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nobrehub-79a61.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nobrehub-79a61-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nobrehub-79a61",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nobrehub-79a61.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "661643677050",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:661643677050:web:8cca33c7555a59a1011ac3"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const realtimeDb = getDatabase(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);

// Re-export utilities for convenience
export { ref, onValue, set, push, remove, onDisconnect, serverTimestamp };

// Helper: Sync Supabase auth with Firebase (for authenticated realtime access)
export async function syncFirebaseAuth(supabaseToken: string): Promise<void> {
    try {
        // For now, we'll use anonymous access to Firebase Realtime DB
        // In production, implement custom token generation via Edge Function
        console.log('🔥 Firebase: Auth sync placeholder (using public rules for now)');
    } catch (error) {
        console.error('🔥 Firebase: Auth sync failed:', error);
    }
}

// Debug helper
export function logFirebaseConnection() {
    console.log('🔥 Firebase initialized with config:', {
        projectId: firebaseConfig.projectId,
        databaseURL: firebaseConfig.databaseURL
    });
}

logFirebaseConnection();
