/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB — MIGRAÇÃO: RTDB → FIRESTORE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Este script migra dados do Firebase Realtime Database para o Firestore:
 *
 *   1. /conversations (RTDB)         → conversations/ (Firestore collection)
 *   2. /messages/{convId}/* (RTDB)    → conversations/{convId}/messages/ (Firestore subcollection)
 *   3. /messages/{chatId}/* (RTDB)    → team_chats/{chatId}/messages/ (Firestore subcollection)
 *      (Team chat messages are identified by having a `chatId` field)
 *   4. /settings/leadDistribution     → settings/leadDistribution (Firestore document)
 *
 * COMO EXECUTAR:
 *   1. Coloque o arquivo serviceAccountKey.json na pasta scripts/
 *      (Firebase Console → Project Settings → Service Accounts → Generate new private key)
 *   2. Execute: node scripts/migrate-rtdb-to-firestore.js
 *
 * OPÇÕES:
 *   --dry-run    Exibe o que seria migrado sem realmente escrever no Firestore
 *   --force      Sobrescreve dados já existentes no Firestore
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const DATABASE_URL = 'https://nobrehub-79a61-default-rtdb.firebaseio.com';

// Batch size for Firestore writes
const BATCH_SIZE = 400;

// ─── Initialize Firebase Admin ───────────────────────────────────────────────

let serviceAccount;
try {
    const keyPath = resolve(__dirname, 'serviceAccountKey.json');
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch (err) {
    console.error('❌ Não foi possível ler serviceAccountKey.json');
    console.error('   Coloque o arquivo na pasta scripts/ e tente novamente.');
    console.error('   (Firebase Console → Project Settings → Service Accounts → Generate new private key)');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL,
});

const rtdb = admin.database();
const firestore = admin.firestore();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(emoji, msg) {
    console.log(`${emoji}  ${msg}`);
}

function convertTimestamp(ms) {
    if (!ms) return null;
    if (typeof ms === 'number') {
        return admin.firestore.Timestamp.fromMillis(ms);
    }
    return ms;
}

/**
 * Determines if a message group key belongs to a team chat rather than inbox.
 * Team chat keys are either:
 *   - DM format: "userId1_userId2" (two Firebase UIDs joined by underscore)
 *   - Group chat: push ID format starting with "-" but with `chatId` field in messages
 */
function isTeamChatKey(key, sampleMessage) {
    // If the message has a `chatId` field, it's a team chat message
    if (sampleMessage && sampleMessage.chatId) return true;
    // DM format: uid1_uid2 — UIDs are typically 28 chars, no leading dash
    if (!key.startsWith('-') && key.includes('_')) return true;
    return false;
}

/**
 * Converts an RTDB conversation object to the Firestore format expected
 * by the rewritten InboxService.
 */
function buildConversationDoc(rtdbConv) {
    const doc = {
        channel: rtdbConv.channel || 'whatsapp',
        leadId: rtdbConv.leadId || '',
        leadName: rtdbConv.leadName || '',
        leadPhone: rtdbConv.leadPhone || '',
        leadEmail: rtdbConv.leadEmail || '',
        leadCompany: rtdbConv.leadCompany || '',
        tags: rtdbConv.tags || [],
        notes: rtdbConv.notes || '',
        unreadCount: rtdbConv.unreadCount || 0,
        status: rtdbConv.status || 'open',
        updatedAt: convertTimestamp(rtdbConv.updatedAt),
        createdAt: convertTimestamp(rtdbConv.createdAt || rtdbConv.updatedAt),
    };

    // Optional fields — only write them if they exist
    if (rtdbConv.lastMessage) {
        doc.lastMessage = {
            ...rtdbConv.lastMessage,
            timestamp: convertTimestamp(rtdbConv.lastMessage.timestamp),
        };
    }
    if (rtdbConv.assignedTo) doc.assignedTo = rtdbConv.assignedTo;
    if (rtdbConv.context) doc.context = rtdbConv.context;
    if (rtdbConv.source) doc.source = rtdbConv.source;
    if (rtdbConv.dealStatus) doc.dealStatus = rtdbConv.dealStatus;
    if (rtdbConv.postSalesId) doc.postSalesId = rtdbConv.postSalesId;
    if (rtdbConv.lossReason) doc.lossReason = rtdbConv.lossReason;
    if (rtdbConv.stage) doc.stage = rtdbConv.stage;
    if (rtdbConv.customFields) doc.customFields = rtdbConv.customFields;
    if (rtdbConv.isFavorite !== undefined) doc.isFavorite = rtdbConv.isFavorite;
    if (rtdbConv.isPinned !== undefined) doc.isPinned = rtdbConv.isPinned;
    if (rtdbConv.transferredToPostSalesAt) {
        doc.transferredToPostSalesAt = convertTimestamp(rtdbConv.transferredToPostSalesAt);
    }

    return doc;
}

/**
 * Converts an RTDB inbox message to Firestore format.
 */
function buildInboxMessageDoc(rtdbMsg) {
    const doc = {
        content: rtdbMsg.content || '',
        direction: rtdbMsg.direction || 'in',
        senderId: rtdbMsg.senderId || 'lead',
        status: rtdbMsg.status || 'received',
        timestamp: convertTimestamp(rtdbMsg.timestamp),
        type: rtdbMsg.type || 'text',
    };

    if (rtdbMsg.whatsappMessageId) doc.whatsappMessageId = rtdbMsg.whatsappMessageId;
    if (rtdbMsg.isSystemMessage) doc.isSystemMessage = rtdbMsg.isSystemMessage;
    if (rtdbMsg.mediaUrl) doc.mediaUrl = rtdbMsg.mediaUrl;
    if (rtdbMsg.mediaName) doc.mediaName = rtdbMsg.mediaName;
    if (rtdbMsg.templateName) doc.templateName = rtdbMsg.templateName;
    if (rtdbMsg.viewOnce !== undefined) doc.viewOnce = rtdbMsg.viewOnce;

    return doc;
}

/**
 * Converts an RTDB team chat message to Firestore format.
 * Team chat messages use `createdAt` instead of `timestamp`.
 */
function buildTeamChatMessageDoc(rtdbMsg) {
    const doc = {
        content: rtdbMsg.content || '',
        senderId: rtdbMsg.senderId || '',
        type: rtdbMsg.type || 'text',
        createdAt: convertTimestamp(rtdbMsg.createdAt),
    };

    return doc;
}

/**
 * Writes documents in batches to avoid Firestore limits.
 */
async function commitInBatches(operations) {
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const batch = firestore.batch();
        const chunk = operations.slice(i, i + BATCH_SIZE);

        for (const op of chunk) {
            batch.set(op.ref, op.data);
        }

        await batch.commit();
    }
}

// ─── Migration: Conversations ────────────────────────────────────────────────

async function migrateConversations() {
    log('📦', 'Lendo /conversations do RTDB...');
    const snapshot = await rtdb.ref('/conversations').get();

    if (!snapshot.exists()) {
        log('⚠️', 'Nenhuma conversation encontrada no RTDB.');
        return { conversations: 0, skipped: 0 };
    }

    const allConversations = snapshot.val();
    const conversationIds = Object.keys(allConversations);
    log('📊', `Encontradas ${conversationIds.length} conversations no RTDB.`);

    let migrated = 0;
    let skipped = 0;
    const operations = [];

    for (const convId of conversationIds) {
        const rtdbConv = allConversations[convId];

        // Check if already exists in Firestore
        if (!FORCE) {
            const existing = await firestore.collection('conversations').doc(convId).get();
            if (existing.exists) {
                skipped++;
                continue;
            }
        }

        const firestoreConvDoc = buildConversationDoc(rtdbConv);

        if (DRY_RUN) {
            log('🔍', `[DRY-RUN] Conversation: ${convId} (${rtdbConv.leadName || 'sem nome'})`);
        } else {
            operations.push({
                ref: firestore.collection('conversations').doc(convId),
                data: firestoreConvDoc,
            });
        }
        migrated++;
    }

    if (!DRY_RUN && operations.length > 0) {
        await commitInBatches(operations);
        log('✅', `${migrated} conversations migradas com sucesso.`);
    }

    if (skipped > 0) {
        log('⏭️', `${skipped} conversations puladas (já existiam). Use --force para sobrescrever.`);
    }

    return { conversations: migrated, skipped };
}

// ─── Migration: Messages ─────────────────────────────────────────────────────

async function migrateMessages() {
    log('📦', 'Lendo /messages do RTDB...');
    const snapshot = await rtdb.ref('/messages').get();

    if (!snapshot.exists()) {
        log('⚠️', 'Nenhuma mensagem encontrada no RTDB.');
        return { inboxMessages: 0, teamChatMessages: 0, teamChatsCreated: 0 };
    }

    const allMessages = snapshot.val();
    const parentKeys = Object.keys(allMessages);
    log('📊', `Encontrados ${parentKeys.length} grupos de mensagens no RTDB.`);

    let inboxMessages = 0;
    let teamChatMessages = 0;
    let teamChatsCreated = 0;

    for (const parentKey of parentKeys) {
        const messagesObj = allMessages[parentKey];
        const messageIds = Object.keys(messagesObj);

        if (messageIds.length === 0) continue;

        // Identify the first message to determine type
        const sampleMessage = messagesObj[messageIds[0]];
        const isTeamChat = isTeamChatKey(parentKey, sampleMessage);

        if (isTeamChat) {
            // ── Team Chat Messages → team_chats/{chatId}/messages/ ──
            const chatId = parentKey;

            if (!FORCE) {
                // Check if team_chat already has messages
                const existingMsgs = await firestore
                    .collection('team_chats')
                    .doc(chatId)
                    .collection('messages')
                    .limit(1)
                    .get();

                if (!existingMsgs.empty) {
                    log('⏭️', `Team chat ${chatId}: mensagens já existem. Pulando.`);
                    continue;
                }
            }

            // Determine chat type and participants from the key
            const isPrivate = !chatId.startsWith('-') && chatId.includes('_');
            const participants = isPrivate ? chatId.split('_') : [];

            // Create team_chat document if it doesn't exist
            const chatDocRef = firestore.collection('team_chats').doc(chatId);
            const chatDocSnap = await chatDocRef.get();

            if (!chatDocSnap.exists || FORCE) {
                // Derive the lastMessage from the messages
                let lastMsg = null;
                let lastMsgTime = 0;
                for (const msgId of messageIds) {
                    const msg = messagesObj[msgId];
                    if (msg.createdAt && msg.createdAt > lastMsgTime) {
                        lastMsgTime = msg.createdAt;
                        lastMsg = msg;
                    }
                }

                const chatDoc = {
                    type: isPrivate ? 'private' : 'group',
                    participants: participants,
                    createdAt: convertTimestamp(messagesObj[messageIds[0]]?.createdAt || Date.now()),
                    updatedAt: convertTimestamp(lastMsgTime || Date.now()),
                };

                if (lastMsg) {
                    chatDoc.lastMessage = {
                        content: lastMsg.content || '',
                        senderId: lastMsg.senderId || '',
                        createdAt: convertTimestamp(lastMsg.createdAt),
                    };
                }

                if (!isPrivate) {
                    chatDoc.name = `Chat de Grupo`;
                    // Collect unique senders as participants
                    const senders = new Set();
                    for (const msgId of messageIds) {
                        if (messagesObj[msgId]?.senderId) senders.add(messagesObj[msgId].senderId);
                    }
                    chatDoc.participants = [...senders];
                }

                if (DRY_RUN) {
                    log('🔍', `[DRY-RUN] Team chat "${chatId}" (${chatDoc.type}, ${messageIds.length} msgs)`);
                } else {
                    await chatDocRef.set(chatDoc);
                    teamChatsCreated++;
                }
            }

            // Write messages
            const operations = [];
            for (const msgId of messageIds) {
                const msgDoc = buildTeamChatMessageDoc(messagesObj[msgId]);

                if (DRY_RUN) {
                    // counted below
                } else {
                    operations.push({
                        ref: chatDocRef.collection('messages').doc(msgId),
                        data: msgDoc,
                    });
                }
                teamChatMessages++;
            }

            if (!DRY_RUN && operations.length > 0) {
                await commitInBatches(operations);
                log('  💬', `Team chat ${chatId}: ${operations.length} mensagens migradas`);
            }
        } else {
            // ── Inbox Messages → conversations/{convId}/messages/ ──
            const convId = parentKey;

            if (!FORCE) {
                // Check if conversation already has messages
                const existingMsgs = await firestore
                    .collection('conversations')
                    .doc(convId)
                    .collection('messages')
                    .limit(1)
                    .get();

                if (!existingMsgs.empty) {
                    continue; // already migrated
                }
            }

            const operations = [];
            for (const msgId of messageIds) {
                const msgDoc = buildInboxMessageDoc(messagesObj[msgId]);

                if (!DRY_RUN) {
                    operations.push({
                        ref: firestore.collection('conversations').doc(convId).collection('messages').doc(msgId),
                        data: msgDoc,
                    });
                }
                inboxMessages++;
            }

            if (!DRY_RUN && operations.length > 0) {
                await commitInBatches(operations);
            }

            if (DRY_RUN) {
                log('🔍', `[DRY-RUN] Inbox ${convId}: ${messageIds.length} msgs`);
            } else {
                log('  💬', `Inbox ${convId}: ${messageIds.length} mensagens migradas`);
            }
        }
    }

    return { inboxMessages, teamChatMessages, teamChatsCreated };
}

// ─── Migration: Settings ─────────────────────────────────────────────────────

async function migrateSettings() {
    log('📦', 'Lendo /settings/leadDistribution do RTDB...');
    const snapshot = await rtdb.ref('/settings/leadDistribution').get();

    if (!snapshot.exists()) {
        log('⚠️', 'settings/leadDistribution não encontrado no RTDB.');
        return false;
    }

    const rtdbSettings = snapshot.val();
    log('📊', `Settings: enabled=${rtdbSettings.enabled}, mode=${rtdbSettings.mode}, participantes=${rtdbSettings.participants?.length || 0}`);

    // Check if already exists
    if (!FORCE) {
        const existing = await firestore.doc('settings/leadDistribution').get();
        if (existing.exists) {
            log('⏭️', 'settings/leadDistribution já existe. Pulando.');
            return false;
        }
    }

    const firestoreSettings = {
        enabled: rtdbSettings.enabled || false,
        mode: rtdbSettings.mode || 'manual',
        participants: rtdbSettings.participants || [],
        updatedAt: convertTimestamp(rtdbSettings.updatedAt),
    };

    if (DRY_RUN) {
        log('🔍', '[DRY-RUN] Migraria settings/leadDistribution');
    } else {
        await firestore.doc('settings/leadDistribution').set(firestoreSettings);
        log('✅', 'settings/leadDistribution migrado!');
    }

    return true;
}

// ─── Cleanup: Delete Orphan Collections ──────────────────────────────────────

async function deleteCollection(collectionName) {
    log('🗑️', `Deletando collection "${collectionName}"...`);

    let totalDeleted = 0;

    // Firestore batch delete supports up to 500 docs at a time
    while (true) {
        const snapshot = await firestore.collection(collectionName).limit(BATCH_SIZE).get();

        if (snapshot.empty) break;

        if (DRY_RUN) {
            totalDeleted += snapshot.size;
            log('🔍', `[DRY-RUN] Deletaria ${snapshot.size} docs de "${collectionName}"...`);
            break; // In dry-run, just report the first batch count
        }

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        totalDeleted += snapshot.size;
        log('  🗑️', `Deletados ${snapshot.size} docs de "${collectionName}" (total: ${totalDeleted})`);

        // If fewer than BATCH_SIZE, we've reached the end
        if (snapshot.size < BATCH_SIZE) break;
    }

    return totalDeleted;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  NOBRE HUB — Migração RTDB → Firestore + Limpeza');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    if (DRY_RUN) {
        log('🏃', 'Modo DRY-RUN — nenhum dado será escrito/deletado.');
        console.log('');
    }

    if (FORCE) {
        log('⚡', 'Modo FORCE — dados existentes serão sobrescritos.');
        console.log('');
    }

    const startTime = Date.now();

    // ── Step 1: Conversations ──
    log('🚀', '── PASSO 1: Migrando Conversations ──');
    const convResult = await migrateConversations();
    console.log('');

    // ── Step 2: Messages (inbox + team chat) ──
    log('🚀', '── PASSO 2: Migrando Messages ──');
    const msgResult = await migrateMessages();
    console.log('');

    // ── Step 3: Settings ──
    log('🚀', '── PASSO 3: Migrando Settings ──');
    const settingsMigrated = await migrateSettings();
    console.log('');

    // ── Step 4: Cleanup orphan collections ──
    log('🚀', '── PASSO 4: Limpando collections órfãs ──');
    const projectsDeleted = await deleteCollection('projects');
    const strategicNotesDeleted = await deleteCollection('strategic_notes');
    console.log('');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // ── Summary ──
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  RESUMO DA MIGRAÇÃO');
    console.log('═══════════════════════════════════════════════════════════════');
    log('📊', `Conversations (inbox): ${convResult.conversations} migradas, ${convResult.skipped} puladas`);
    log('💬', `Inbox messages: ${msgResult.inboxMessages}`);
    log('👥', `Team chats criados: ${msgResult.teamChatsCreated}`);
    log('💬', `Team chat messages: ${msgResult.teamChatMessages}`);
    log('⚙️', `Settings: ${settingsMigrated ? 'Migrado' : 'Pulado/Não encontrado'}`);
    log('🗑️', `Collections limpas: "projects" (${projectsDeleted} docs), "strategic_notes" (${strategicNotesDeleted} docs)`);
    log('⏱️', `Tempo total: ${elapsed}s`);
    console.log('');

    if (DRY_RUN) {
        log('💡', 'Execute sem --dry-run para realmente migrar/limpar os dados.');
    } else {
        log('✅', 'Migração e limpeza concluídas!');
        console.log('');
        log('📋', 'PRÓXIMOS PASSOS:');
        log('  1.', 'Crie o índice composto no Firestore Console:');
        log('    ', 'collectionGroup("messages") → whatsappMessageId ASC');
        log('  2.', 'Teste a aplicação com os dados migrados.');
        log('  3.', 'Depois de validar, você pode remover os dados do RTDB.');
    }

    console.log('');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
