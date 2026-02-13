/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST-SALES SHARED HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shared constants, types, and utility functions used by both
 * PostSalesDistributionService and PostSalesClientService.
 */

import { Lead, ClientStatus } from '@/types/lead.types';
import { Project } from '@/types/project.types';
import { COLLECTIONS } from '@/config';

export const LEADS_TABLE = COLLECTIONS.LEADS;
export const PROJECTS_TABLE = COLLECTIONS.PRODUCTION_PROJECTS;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PostSalesWorkload {
    postSalesId: string;
    postSalesName: string;
    activeClients: number;
}

export interface DistributionClient extends Lead {
    previousAttendant?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const ACTIVE_CLIENT_STATUSES: ClientStatus[] = [
    'aguardando_projeto',
    'aguardando_alteracao',
    'entregue',
    'aguardando_pagamento'
];

// ─── Status Logic ───────────────────────────────────────────────────────────

export const getLeadClientStatusFromProjects = (projects: Project[]): ClientStatus => {
    if (projects.length === 0) return 'aguardando_projeto';

    const hasAlteration = projects.some(
        project => project.status === 'alteracao' || project.status === 'alteracao_interna' || project.status === 'alteracao_cliente' || project.clientApprovalStatus === 'changes_requested'
    );
    if (hasAlteration) return 'aguardando_alteracao';

    const hasPendingPayment = projects.some(
        project => project.clientApprovalStatus === 'approved' && project.paymentStatus !== 'paid'
    );
    if (hasPendingPayment) return 'aguardando_pagamento';

    const hasDeliveredAwaitingApproval = projects.some(
        project => project.status === 'entregue' && project.clientApprovalStatus !== 'approved'
    );
    if (hasDeliveredAwaitingApproval) return 'entregue';

    return 'aguardando_projeto';
};

// ─── Row Mappers ────────────────────────────────────────────────────────────

export const mapRowToDistributionClient = (row: Record<string, unknown>): DistributionClient => {
    const previousPostSalesIds = (row.previous_post_sales_ids as string[]) || [];
    return {
        ...row,
        id: row.id as string,
        createdAt: new Date((row.created_at as string) || Date.now()),
        updatedAt: new Date((row.updated_at as string) || Date.now()),
        dealClosedAt: row.deal_closed_at ? new Date(row.deal_closed_at as string) : undefined,
        previousAttendant: previousPostSalesIds.length > 0
            ? previousPostSalesIds[previousPostSalesIds.length - 1]
            : undefined
    } as DistributionClient;
};

export const mapRowToProject = (row: Record<string, unknown>): Project => {
    return {
        ...row,
        id: row.id as string,
        dueDate: row.due_date ? new Date(row.due_date as string) : new Date(),
        createdAt: new Date((row.created_at as string) || Date.now()),
        updatedAt: new Date((row.updated_at as string) || Date.now()),
        assignedAt: row.assigned_at ? new Date(row.assigned_at as string) : undefined,
        postSalesAssignedAt: row.post_sales_assigned_at ? new Date(row.post_sales_assigned_at as string) : undefined,
        deliveredToClientAt: row.delivered_to_client_at ? new Date(row.delivered_to_client_at as string) : undefined,
        clientApprovedAt: row.client_approved_at ? new Date(row.client_approved_at as string) : undefined,
        paymentReceivedAt: row.payment_received_at ? new Date(row.payment_received_at as string) : undefined,
        lastRevisionRequestedAt: row.last_revision_requested_at ? new Date(row.last_revision_requested_at as string) : undefined,
    } as Project;
};
