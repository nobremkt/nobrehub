/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB — LIMPEZA DO RTDB
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Remove nós órfãos do Realtime Database que já foram migrados
 * para o Firestore ou não têm mais referências no código.
 *
 * Nós que PERMANECEM:
 *   - /status       → usePresence.ts + useTeamStatus.ts (online/idle/offline)
 *   - /strategic    → NotesRealtimeService.ts (conteúdo das notas colaborativas)
 *
 * Nós REMOVIDOS:
 *   - /conversations → migrado para Firestore conversations/
 *   - /messages      → migrado para Firestore subcollections messages/
 *   - /settings      → migrado para Firestore settings/leadDistribution
 *   - /chats         → órfão (sem referência no código)
 *   - /user_chats    → órfão (sem referência no código)
 *   - /notifications → órfão (sem referência no código)
 *   - /presence      → órfão (código usa /status, não /presence)
 *
 * COMO EXECUTAR:
 *   node scripts/cleanup-rtdb.js [--dry-run]
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const DATABASE_URL = 'https://nobrehub-79a61-default-rtdb.firebaseio.com';

// ─── Initialize ──────────────────────────────────────────────────────────────

let serviceAccount;
try {
    const keyPath = resolve(__dirname, 'serviceAccountKey.json');
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch (err) {
    console.error('❌ serviceAccountKey.json não encontrado em scripts/');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DATABASE_URL,
    });
}

const rtdb = admin.database();

// ─── Nodes to delete ─────────────────────────────────────────────────────────

const NODES_TO_DELETE = [
    '/conversations',
    '/messages',
    '/settings',
    '/chats',
    '/user_chats',
    '/notifications',
    '/presence',
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  NOBRE HUB — Limpeza do RTDB');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    if (DRY_RUN) {
        console.log('🏃  Modo DRY-RUN — nenhum dado será deletado.\n');
    }

    let deleted = 0;
    let skipped = 0;

    for (const path of NODES_TO_DELETE) {
        const snapshot = await rtdb.ref(path).get();

        if (!snapshot.exists()) {
            console.log(`⏭️  ${path} — não existe, pulando.`);
            skipped++;
            continue;
        }

        // Count children for logging
        const childCount = snapshot.numChildren();
        const sizeInfo = childCount > 0 ? `${childCount} children` : 'leaf node';

        if (DRY_RUN) {
            console.log(`🔍  [DRY-RUN] Deletaria ${path} (${sizeInfo})`);
        } else {
            await rtdb.ref(path).remove();
            console.log(`🗑️  Deletado: ${path} (${sizeInfo})`);
        }
        deleted++;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  RESULTADO: ${deleted} nós deletados, ${skipped} pulados`);
    console.log('');
    console.log('  Nós mantidos:');
    console.log('    ✅ /status     (presença online/idle/offline)');
    console.log('    ✅ /strategic  (conteúdo das notas colaborativas)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
