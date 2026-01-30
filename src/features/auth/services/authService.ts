/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: AUTH - SERVICES
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/config/firebase';
import type { User } from '@/types';

/**
 * Login com email e senha
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Buscar dados adicionais do usuário no Firestore
    const userData = await getUserData(result.user.uid);

    if (!userData) {
        throw new Error('Usuário não encontrado no sistema');
    }

    return userData;
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
    const auth = getFirebaseAuth();
    await signOut(auth);
}

/**
 * Buscar dados do usuário no Firestore
 */
export async function getUserData(uid: string): Promise<User | null> {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return null;
    }

    const data = userSnap.data();

    return {
        id: userSnap.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        role: data.role,
        sector: data.sector,
        phone: data.phone,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
    };
}

/**
 * Observar mudanças no estado de autenticação
 */
export function subscribeToAuthState(
    callback: (user: FirebaseUser | null) => void
): () => void {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, callback);
}
