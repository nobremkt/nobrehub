import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ProjectStatus } from '@/types/project.types';

const PROJECTS_COLLECTION = 'production_projects';
const STATUS_PAGES_COLLECTION = 'project_status_pages';
const PUBLIC_STATUS_BASE_PATH = '/status/projeto';

type FirestoreDate = Date | Timestamp | string | number | null | undefined;

export interface PublicProjectStatus {
    token: string;
    projectId: string;
    statusPageUrl: string;
    projectName: string;
    leadName: string;
    sellerName?: string;
    sellerPhotoUrl?: string;
    producerName?: string;
    producerPhotoUrl?: string;
    postSalesName?: string;
    postSalesPhotoUrl?: string;
    status: ProjectStatus;
    dueDate?: Date;
    deliveredToClientAt?: Date;
    updatedAt?: Date;
}

interface ProjectStatusSnapshot {
    id: string;
    name: string;
    leadName: string;
    leadId?: string;
    sellerName?: string;
    sellerPhotoUrl?: string;
    producerName?: string;
    producerPhotoUrl?: string;
    postSalesName?: string;
    postSalesPhotoUrl?: string;
    status: ProjectStatus;
    dueDate?: FirestoreDate;
    deliveredToClientAt?: FirestoreDate;
    statusPageToken?: string;
    statusPageUrl?: string;
}

const parseDate = (value: FirestoreDate): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeToken = (token: string): string => token.trim();

const getBasePublicUrl = (): string => {
    const envBase = (import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.VITE_APP_URL || '').trim();
    if (envBase) {
        return envBase.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '');
    }

    return '';
};

const buildStatusPagePath = (token: string): string => `${PUBLIC_STATUS_BASE_PATH}/${normalizeToken(token)}`;

const buildStatusPageUrl = (token: string): string => {
    const path = buildStatusPagePath(token);
    const base = getBasePublicUrl();
    return base ? `${base}${path}` : path;
};

const toPublicStatusPayload = (project: ProjectStatusSnapshot, token: string, statusPageUrl: string) => ({
    token,
    projectId: project.id,
    statusPageUrl,
    projectName: project.name,
    leadName: project.leadName,
    sellerName: project.sellerName || '',
    sellerPhotoUrl: project.sellerPhotoUrl || '',
    producerName: project.producerName || '',
    producerPhotoUrl: project.producerPhotoUrl || '',
    postSalesName: project.postSalesName || '',
    postSalesPhotoUrl: project.postSalesPhotoUrl || '',
    status: project.status,
    dueDate: parseDate(project.dueDate) || null,
    deliveredToClientAt: parseDate(project.deliveredToClientAt) || null,
    updatedAt: serverTimestamp()
});

const generateToken = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(18);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`;
};

const ensureStatusPageIdentity = async (projectId: string, currentToken?: string, currentUrl?: string) => {
    const token = currentToken && currentToken.trim() ? currentToken : generateToken();
    const statusPageUrl = currentUrl && currentUrl.trim() ? currentUrl : buildStatusPageUrl(token);

    if (!currentToken || !currentUrl) {
        await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
            statusPageToken: token,
            statusPageUrl
        });
    }

    return { token, statusPageUrl };
};

const mapStatusDoc = (data: Record<string, unknown>): PublicProjectStatus | null => {
    if (!data.projectId || !data.token || !data.projectName || !data.leadName || !data.statusPageUrl || !data.status) {
        return null;
    }

    return {
        token: String(data.token),
        projectId: String(data.projectId),
        statusPageUrl: String(data.statusPageUrl),
        projectName: String(data.projectName),
        leadName: String(data.leadName),
        sellerName: data.sellerName ? String(data.sellerName) : undefined,
        sellerPhotoUrl: data.sellerPhotoUrl ? String(data.sellerPhotoUrl) : undefined,
        producerName: data.producerName ? String(data.producerName) : undefined,
        producerPhotoUrl: data.producerPhotoUrl ? String(data.producerPhotoUrl) : undefined,
        postSalesName: data.postSalesName ? String(data.postSalesName) : undefined,
        postSalesPhotoUrl: data.postSalesPhotoUrl ? String(data.postSalesPhotoUrl) : undefined,
        status: String(data.status) as ProjectStatus,
        dueDate: parseDate(data.dueDate as FirestoreDate),
        deliveredToClientAt: parseDate(data.deliveredToClientAt as FirestoreDate),
        updatedAt: parseDate(data.updatedAt as FirestoreDate)
    };
};

export const ProjectStatusPageService = {
    generateToken,
    buildStatusPagePath,
    buildStatusPageUrl,

    createForProject: async (project: ProjectStatusSnapshot): Promise<{ token: string; statusPageUrl: string }> => {
        const token = project.statusPageToken && project.statusPageToken.trim()
            ? project.statusPageToken
            : generateToken();
        const statusPageUrl = project.statusPageUrl && project.statusPageUrl.trim()
            ? project.statusPageUrl
            : buildStatusPageUrl(token);

        const statusDocRef = doc(db, STATUS_PAGES_COLLECTION, token);
        await setDoc(statusDocRef, {
            ...toPublicStatusPayload(project, token, statusPageUrl),
            createdAt: serverTimestamp()
        }, { merge: true });

        return { token, statusPageUrl };
    },

    syncFromProjectId: async (projectId: string): Promise<void> => {
        const projectDocRef = doc(db, PROJECTS_COLLECTION, projectId);
        const projectDoc = await getDoc(projectDocRef);

        if (!projectDoc.exists()) return;

        const data = projectDoc.data() as Record<string, unknown>;

        // Resolve team names + photos from lead → collaborators
        let sellerName = '';
        let sellerPhotoUrl = '';
        let producerPhotoUrl = '';
        let resolvedPostSalesName = data.postSalesName ? String(data.postSalesName) : '';
        let postSalesPhotoUrl = '';
        const leadId = data.leadId ? String(data.leadId) : '';
        const producerId = data.producerId ? String(data.producerId) : '';

        try {
            // Build parallel fetch list
            const fetchPromises: Promise<any>[] = [];

            // 1. Lead doc (for seller + post-sales IDs)
            const leadPromise = (leadId && leadId !== 'manual')
                ? getDoc(doc(db, 'leads', leadId))
                : Promise.resolve(null);
            fetchPromises.push(leadPromise);

            // 2. Producer doc (for photo)
            const producerPromise = producerId
                ? getDoc(doc(db, 'collaborators', producerId))
                : Promise.resolve(null);
            fetchPromises.push(producerPromise);

            const [leadDoc, producerDoc] = await Promise.all(fetchPromises);

            // Extract producer photo
            if (producerDoc?.exists()) {
                producerPhotoUrl = String(producerDoc.data()?.profilePhotoUrl || '');
            }

            // Extract seller + post-sales from lead
            if (leadDoc?.exists()) {
                const leadData = leadDoc.data();
                const responsibleId = leadData?.responsibleId ? String(leadData.responsibleId) : '';
                const postSalesId = leadData?.postSalesId ? String(leadData.postSalesId) : '';

                const [sellerDoc, postSalesDoc] = await Promise.all([
                    responsibleId ? getDoc(doc(db, 'collaborators', responsibleId)) : Promise.resolve(null),
                    postSalesId ? getDoc(doc(db, 'collaborators', postSalesId)) : Promise.resolve(null),
                ]);

                if (sellerDoc?.exists()) {
                    const d = sellerDoc.data();
                    sellerName = String(d?.name || '');
                    sellerPhotoUrl = String(d?.profilePhotoUrl || '');
                }
                if (postSalesDoc?.exists()) {
                    const d = postSalesDoc.data();
                    resolvedPostSalesName = String(d?.name || '');
                    postSalesPhotoUrl = String(d?.profilePhotoUrl || '');
                }
            }
        } catch {
            // Non-critical: team info is optional
        }

        const snapshot: ProjectStatusSnapshot = {
            id: projectDoc.id,
            name: String(data.name || 'Projeto sem nome'),
            leadName: String(data.leadName || 'Cliente'),
            leadId,
            sellerName,
            sellerPhotoUrl,
            producerName: data.producerName ? String(data.producerName) : '',
            producerPhotoUrl,
            postSalesName: resolvedPostSalesName,
            postSalesPhotoUrl,
            status: (String(data.status || 'aguardando') as ProjectStatus),
            dueDate: data.dueDate as FirestoreDate,
            deliveredToClientAt: data.deliveredToClientAt as FirestoreDate,
            statusPageToken: data.statusPageToken ? String(data.statusPageToken) : undefined,
            statusPageUrl: data.statusPageUrl ? String(data.statusPageUrl) : undefined
        };

        const { token, statusPageUrl } = await ensureStatusPageIdentity(
            snapshot.id,
            snapshot.statusPageToken,
            snapshot.statusPageUrl
        );

        const statusDocRef = doc(db, STATUS_PAGES_COLLECTION, token);
        await setDoc(statusDocRef, toPublicStatusPayload(snapshot, token, statusPageUrl), { merge: true });
    },

    getByToken: async (token: string): Promise<PublicProjectStatus | null> => {
        const normalizedToken = normalizeToken(token);
        const statusDocRef = doc(db, STATUS_PAGES_COLLECTION, normalizedToken);
        const statusDoc = await getDoc(statusDocRef);

        if (statusDoc.exists()) {
            return mapStatusDoc(statusDoc.data() as Record<string, unknown>);
        }

        // Fallback para legado: procura por token salvo no projeto e sincroniza
        const projectsRef = collection(db, PROJECTS_COLLECTION);
        const legacyQuery = query(projectsRef, where('statusPageToken', '==', normalizedToken));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyProject = legacySnapshot.docs[0];

        if (!legacyProject) return null;

        await ProjectStatusPageService.syncFromProjectId(legacyProject.id);

        const syncedDoc = await getDoc(statusDocRef);
        if (!syncedDoc.exists()) return null;

        return mapStatusDoc(syncedDoc.data() as Record<string, unknown>);
    },

    subscribeByToken: (token: string, callback: (status: PublicProjectStatus | null) => void) => {
        const normalizedToken = normalizeToken(token);
        const statusDocRef = doc(db, STATUS_PAGES_COLLECTION, normalizedToken);

        return onSnapshot(statusDocRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback(null);
                return;
            }

            callback(mapStatusDoc(snapshot.data() as Record<string, unknown>));
        }, () => {
            callback(null);
        });
    }
};
