import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    // For Vercel, we use environment variables
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to handle escaped newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();

export default async function handler(req, res) {
    // Handle webhook verification (GET request from 360Dialog/Meta)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // You should set WEBHOOK_VERIFY_TOKEN in your environment variables
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
            // 360Dialog/WhatsApp Cloud API webhook structure
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
    const phoneNumber = message.from; // e.g., "5535998231509"
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000; // Convert to milliseconds
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

    // Find or create conversation
    const conversationsRef = db.ref('conversations');
    const snapshot = await conversationsRef
        .orderByChild('leadPhone')
        .equalTo(phoneNumber)
        .once('value');

    const firestore = admin.firestore();

    let conversationId;
    let existingConversation = null;

    if (snapshot.exists()) {
        // Conversation exists, get the first match
        const conversations = snapshot.val();
        conversationId = Object.keys(conversations)[0];
        existingConversation = conversations[conversationId];
    } else {
        // Create new conversation
        const newConvRef = conversationsRef.push();
        conversationId = newConvRef.key;

        const now = new Date();
        const leadData = {
            name: contactName,
            phone: phoneNumber,
            email: '',
            company: '',
            pipeline: 'pos-venda', // WhatsApp -> Low Ticket
            status: 'lt-entrada',
            order: 0,
            estimatedValue: 0,
            tags: ['Novo', 'WhatsApp'],
            responsibleId: 'admin',
            source: 'whatsapp',
            createdAt: now,
            updatedAt: now,
        };

        // 1. Create in Realtime DB (Inbox)
        await newConvRef.set({
            leadId: `whatsapp_${phoneNumber}`,
            leadName: leadData.name,
            leadPhone: leadData.phone,
            leadEmail: leadData.email,
            leadCompany: leadData.company,
            tags: leadData.tags,
            notes: '',
            unreadCount: 1,
            channel: 'whatsapp',
            status: 'open',
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 2. Create in Firestore (CRM)
        // Check if lead exists in Firestore first (by phone) to be safe
        const leadsRef = firestore.collection('leads');
        const leadQuery = await leadsRef.where('phone', '==', phoneNumber).get();

        if (leadQuery.empty) {
            // Use the SAME leadId as the RTDB conversation
            const leadId = `whatsapp_${phoneNumber}`;
            await leadsRef.doc(leadId).set(leadData);
            console.log(`Created new CRM lead with ID: ${leadId}`);
        }
    }

    // Create the message
    const messagesRef = db.ref(`messages/${conversationId}`);
    const newMsgRef = messagesRef.push();

    const messageData = {
        id: newMsgRef.key,
        whatsappMessageId: messageId,
        content: content,
        senderId: 'lead',
        direction: 'in',
        timestamp: timestamp,
        status: 'received',
        type: messageType,
    };

    await newMsgRef.set(messageData);

    // Update conversation with last message and increment unread count
    const conversationRef = db.ref(`conversations/${conversationId}`);
    const currentUnread = existingConversation?.unreadCount || 0;

    await conversationRef.update({
        lastMessage: messageData,
        unreadCount: currentUnread + 1,
        updatedAt: timestamp,
        // Update name if we got it from profile
        ...(contactName !== phoneNumber && { leadName: contactName }),
    });

    console.log(`Message saved to conversation ${conversationId}`);
}

async function processStatusUpdate(status) {
    const messageId = status.id;
    const statusType = status.status; // sent, delivered, read, failed

    console.log(`Status update for message ${messageId}: ${statusType}`);

    // Find the message by whatsappMessageId and update its status
    // This is a simplified approach - in production you'd want an index
    const messagesRef = db.ref('messages');
    const snapshot = await messagesRef.once('value');

    if (snapshot.exists()) {
        const allConversations = snapshot.val();

        for (const convId in allConversations) {
            const messages = allConversations[convId];
            for (const msgId in messages) {
                if (messages[msgId].whatsappMessageId === messageId) {
                    await db.ref(`messages/${convId}/${msgId}/status`).set(statusType);
                    console.log(`Updated message ${msgId} status to ${statusType}`);
                    return;
                }
            }
        }
    }
}
