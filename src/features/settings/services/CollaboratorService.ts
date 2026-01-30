import { getFirestoreDb, getFirebaseAuth } from '@/config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    doc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    addDoc,
    updateDoc
} from 'firebase/firestore';
import { Collaborator } from '../types';

const COLLECTION_NAME = 'collaborators';

export const CollaboratorService = {
    /**
     * Lista todos os colaboradores
     */
    getCollaborators: async (): Promise<Collaborator[]> => {
        const db = getFirestoreDb();
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Collaborator[];
    },

    /**
     * Cria um novo colaborador
     */
    createCollaborator: async (collaborator: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }): Promise<string> => {
        const db = getFirestoreDb();
        let authUid = undefined;

        // Se tiver senha, cria usuário no Auth
        if (collaborator.password) {
            const auth = getFirebaseAuth();
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, collaborator.email, collaborator.password);
                authUid = userCredential.user.uid;
            } catch (error: any) {
                console.error("Erro ao criar usuário no Auth:", error);
                // Propaga erro para ser tratado na UI (ex: email já existe)
                throw new Error(`Erro na criação do usuário: ${error.message}`);
            }
        }

        // Remove a senha do objeto antes de salvar no Firestore
        const { password, ...collaboratorData } = collaborator;

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...collaboratorData,
            authUid,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return docRef.id;
    },

    /**
     * Atualiza um colaborador existente
     */
    updateCollaborator: async (id: string, updates: Partial<Omit<Collaborator, 'id' | 'createdAt'>> & { password?: string }): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        const { password, ...collaboratorData } = updates;

        // Se uma nova senha for fornecida, tentaremos lidar com a atualização
        // O Firebase Client SDK não permite atualizar senha de outro usuário.
        // Isso aqui só funcionaria se fosse o próprio usuário logado.
        if (password) {
            console.warn("Atenção: A atualização de senha via Admin Panel não altera o Firebase Auth diretamente sem Admin SDK.");
            // TODO: Se tiver backend, chamar endpoint.
            // Por enquanto, não faz nada com a senha além de (erroneamente) salvar se deixássemos,
            // mas já separamos em 'collaboratorData'.

            // Sugestão: Lançar um erro ou apenas ignorar e assumir que o fluxo será via Reset de Senha.
            // Para UX, vamos lançar um erro informando.


            // Se o usuário estiver tentando mudar a PRÓPRIA senha, podemos tentar.
            // Mas não temos como verificar facilmente se o ID do colaborador bate com o Auth UID aqui sem buscar o doc.
            // Simplificação: bloqueia atualização de senha por aqui.
            throw new Error("Por segurança, a alteração de senhas deve ser feita via 'Esqueci minha senha' ou pelo próprio usuário.");
        }

        await updateDoc(docRef, {
            ...collaboratorData,
            updatedAt: Date.now()
        });
    },

    /**
     * Remove um colaborador
     */
    deleteCollaborator: async (id: string): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
