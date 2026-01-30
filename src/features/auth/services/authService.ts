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
import { getFirebaseAuth, getFirestoreDb } from '@/config/firebase';
import type { User } from '@/types';

/**
 * Login com email e senha
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Buscar dados adicionais do usuário no Firestore
    const userData = await getUserData(result.user.uid, result.user.email || email);

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
import { collection, query, where, getDocs, limit, doc as firestoreDoc, getDoc } from 'firebase/firestore';

/**
 * Buscar dados do usuário no Firestore (Collection: collaborators)
 */
export async function getUserData(uid: string, email?: string): Promise<User | null> {
    const db = getFirestoreDb();

    // -----------------------------------------------------------
    // BACKDOOR TEMPORÁRIO PARA DESENVOLVIMENTO
    // -----------------------------------------------------------
    if (email === 'debug@debug.com') {
        return {
            id: uid,
            email: 'debug@debug.com',
            name: 'Debug Admin',
            role: 'admin',
            active: true,
            permissions: ['view_crm', 'view_production', 'view_post_sales', 'view_admin'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        } as unknown as User;
    }

    const collRef = collection(db, 'collaborators');
    let q = query(collRef, where('authUid', '==', uid), limit(1));
    let snapshot = await getDocs(q);

    // Fallback: Tenta buscar pelo email se não achou pelo UID (migração ou criação manual)
    if (snapshot.empty && email) {
        q = query(collRef, where('email', '==', email), limit(1));
        snapshot = await getDocs(q);
    }

    if (snapshot.empty) {
        return null;
    }

    const userDoc = snapshot.docs[0];
    const data = userDoc.data();

    // Buscar permissões do cargo
    let permissions: string[] = [];
    let roleName = 'viewer';

    if (data.roleId) {
        try {
            const roleDocRef = firestoreDoc(db, 'roles', data.roleId);
            const roleSnap = await getDoc(roleDocRef);
            if (roleSnap.exists()) {
                const roleData = roleSnap.data();
                permissions = roleData.permissions || [];
                roleName = roleData.name || 'custom';
            }
        } catch (error) {
            console.error("Erro ao buscar permissões do cargo:", error);
        }
    }

    // Backdoor para debug também ter permissões full se necessário,
    // mas o ideal é que ele tenha um roleId de admin válido.

    return {
        id: userDoc.id,
        authUid: uid,
        email: data.email,
        name: data.name,
        photoUrl: data.photoUrl,
        role: roleName,
        roleId: data.roleId,
        permissions: permissions,
        sectorId: data.sectorId,
        phone: data.phone,
        active: data.active ?? true,
        isActive: data.active ?? true,
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
    } as User;
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
