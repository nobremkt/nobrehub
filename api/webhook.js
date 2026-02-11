import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const firestore = admin.firestore();

export default async function handler(req, res) {
    // Handle webhook verification (GET request from 360Dialog/Meta)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'nobrehub_verify_token';

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Webhook verified!');
            return res.status(200).send(challenge);
        } else {
            console.log('Webhook verification failed');
            return res.status(403).send('Forbidden');
        }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
        const body = req.body;

        console.log('Webhook received:', JSON.stringify(body, null, 2));

        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Check if this is a message notification
            if (value?.messages) {
                for (const message of value.messages) {
                    await processIncomingMessage(message, value.contacts?.[0]);
                }
            }

            // Check for status updates (sent, delivered, read)
            if (value?.statuses) {
                for (const status of value.statuses) {
                    await processStatusUpdate(status);
                }
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Webhook processing error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function processIncomingMessage(message, contact) {
    const phoneNumber = message.from;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;
    const messageType = message.type;

    // Get message content based on type
    let content = '';
    if (messageType === 'text') {
        content = message.text?.body || '';
    } else if (messageType === 'image') {
        content = '[Imagem]';
    } else if (messageType === 'audio') {
        content = '[Áudio]';
    } else if (messageType === 'video') {
        content = '[Vídeo]';
    } else if (messageType === 'document') {
        content = '[Documento]';
    } else if (messageType === 'sticker') {
        content = '[Sticker]';
    } else if (messageType === 'location') {
        content = '[Localização]';
    } else {
        content = `[${messageType}]`;
    }

    const contactName = contact?.profile?.name || phoneNumber;

    console.log(`Processing message from ${phoneNumber}: ${content}`);

    // ═══════════════════════════════════════════════════════════════════════
    // Find or create conversation in Firestore
    // ═══════════════════════════════════════════════════════════════════════

    const conversationsRef = firestore.collection('conversations');
    const convQuery = await conversationsRef
        .where('leadPhone', '==', phoneNumber)
        .limit(1)
        .get();

    let conversationId;
    let existingUnreadCount = 0;

    if (!convQuery.empty) {
        // Conversation exists
        const convDoc = convQuery.docs[0];
        conversationId = convDoc.id;
        existingUnreadCount = convDoc.data().unreadCount || 0;
    } else {
        // Create new conversation + lead
        const now = admin.firestore.Timestamp.fromMillis(timestamp);
        const leadId = `whatsapp_${phoneNumber}`;

        // 1. Create conversation in Firestore
        const newConvRef = await conversationsRef.add({
            leadId: leadId,
            leadName: contactName,
            leadPhone: phoneNumber,
            leadEmail: '',
            leadCompany: '',
            tags: ['Novo', 'WhatsApp'],
            notes: '',
            unreadCount: 1,
            channel: 'whatsapp',
            status: 'open',
            context: 'sales',
            lastMessage: null,
            createdAt: now,
            updatedAt: now,
        });

        conversationId = newConvRef.id;

        // 2. Create lead in Firestore (CRM) if not exists
        const leadsRef = firestore.collection('leads');
        const leadQuery = await leadsRef.where('phone', '==', phoneNumber).get();

        if (leadQuery.empty) {
            await leadsRef.doc(leadId).set({
                name: contactName,
                phone: phoneNumber,
                email: '',
                company: '',
                pipeline: 'pos-venda',
                status: 'lt-entrada',
                order: 0,
                estimatedValue: 0,
                tags: ['Novo', 'WhatsApp'],
                responsibleId: 'admin',
                source: 'whatsapp',
                createdAt: now,
                updatedAt: now,
            });
            console.log(`Created new CRM lead with ID: ${leadId}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Create message in subcollection
    // ═══════════════════════════════════════════════════════════════════════

    const messageData = {
        whatsappMessageId: messageId,
        content: content,
        senderId: 'lead',
        direction: 'in',
        timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
        status: 'received',
        type: messageType,
    };

    await firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .add(messageData);

    // Update conversation with last message and increment unread count
    await firestore.collection('conversations').doc(conversationId).update({
        lastMessage: messageData,
        unreadCount: existingUnreadCount + 1,
        updatedAt: admin.firestore.Timestamp.fromMillis(timestamp),
        // Update name if we got it from profile
        ...(contactName !== phoneNumber && { leadName: contactName }),
    });

    console.log(`Message saved to conversation ${conversationId}`);
}

async function processStatusUpdate(status) {
    const whatsappMsgId = status.id;
    const statusType = status.status; // sent, delivered, read, failed

    console.log(`Status update for message ${whatsappMsgId}: ${statusType}`);

    // Query across all conversations' messages subcollections for the whatsappMessageId
    // Using collectionGroup query for efficiency
    const msgQuery = await firestore
        .collectionGroup('messages')
        .where('whatsappMessageId', '==', whatsappMsgId)
        .limit(1)
        .get();

    if (!msgQuery.empty) {
        const msgDoc = msgQuery.docs[0];
        await msgDoc.ref.update({ status: statusType });
        console.log(`Updated message ${msgDoc.id} status to ${statusType}`);
    }
}
