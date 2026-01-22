import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = {
    KANBAN: 'view_kanban',
    WORKSPACE: 'view_workspace',
    LEADS: 'view_leads',
    CHAT: 'view_chat',
    FLOWS: 'manage_flows',
    TEAM: 'view_team',
    ANALYTICS: 'view_analytics',
    SETTINGS: 'manage_settings'
};

const ROLE_CONFIG: Record<string, string[]> = {
    admin: Object.values(PERMISSIONS), // Admin has all
    manager_sales: [
        PERMISSIONS.KANBAN, PERMISSIONS.WORKSPACE, PERMISSIONS.LEADS,
        PERMISSIONS.CHAT, PERMISSIONS.TEAM, PERMISSIONS.ANALYTICS
    ],
    manager_production: [
        PERMISSIONS.KANBAN, PERMISSIONS.WORKSPACE, PERMISSIONS.LEADS,
        PERMISSIONS.CHAT, PERMISSIONS.TEAM, PERMISSIONS.ANALYTICS
    ],
    strategic: [
        PERMISSIONS.KANBAN, PERMISSIONS.WORKSPACE, PERMISSIONS.LEADS,
        PERMISSIONS.CHAT, PERMISSIONS.TEAM, PERMISSIONS.ANALYTICS
    ],
    sdr: [
        PERMISSIONS.WORKSPACE, PERMISSIONS.LEADS
    ],
    closer_ht: [
        PERMISSIONS.WORKSPACE, PERMISSIONS.CHAT
    ],
    closer_lt: [
        PERMISSIONS.WORKSPACE, PERMISSIONS.CHAT
    ],
    production: [
        PERMISSIONS.KANBAN, PERMISSIONS.WORKSPACE
    ],
    post_sales: [
        PERMISSIONS.KANBAN, PERMISSIONS.WORKSPACE, PERMISSIONS.CHAT
    ]
};

async function main() {
    console.log('🔐 Seeding permissions...');

    for (const [role, permissions] of Object.entries(ROLE_CONFIG)) {
        await prisma.roleAccess.upsert({
            where: { role: role as UserRole },
            update: { permissions },
            create: {
                role: role as UserRole,
                permissions
            }
        });
        console.log(`✅ Configured ${role}: ${permissions.length} permissions`);
    }

    console.log('✨ Permissions seeded successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
