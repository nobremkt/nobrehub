import { getFirestoreDb } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface OrganizationSettings {
    companyName: string;
    logoUrl: string | null;
    primaryColor: string;
}

const COLLECTION_NAME = 'settings';
const DOC_ID = 'organization';

export const OrganizationService = {
    /**
     * Busca as configurações da organização no Firestore.
     */
    getSettings: async (): Promise<OrganizationSettings | null> => {
        try {
            const db = getFirestoreDb();
            const docRef = doc(db, COLLECTION_NAME, DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as OrganizationSettings;
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar configurações da organização:', error);
            throw error;
        }
    },

    /**
     * Salva as configurações da organização no Firestore.
     */
    saveSettings: async (settings: Partial<OrganizationSettings>) => {
        try {
            const db = getFirestoreDb();
            const docRef = doc(db, COLLECTION_NAME, DOC_ID);

            // Usa setDoc com merge: true para criar se não existir ou atualizar campos
            await setDoc(docRef, settings, { merge: true });
        } catch (error) {
            console.error('Erro ao salvar configurações da organização:', error);
            throw error;
        }
    }
};
