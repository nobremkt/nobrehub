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
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse body - handle both JSON and form-urlencoded
        let data = req.body;

        // If it's a string (form-urlencoded), parse it
        if (typeof data === 'string') {
            const params = new URLSearchParams(data);
            data = Object.fromEntries(params.entries());
        }

        console.log('=== CREATE-LEAD API DEBUG ===');
        console.log('RAW Data received:', JSON.stringify(data, null, 2));

        // Extract and normalize fields from different form formats
        const leadData = normalizeLeadData(data);
        console.log('NORMALIZED leadData:', JSON.stringify(leadData, null, 2));
        console.log('CustomFields going to save:', {
            instagram: leadData.instagram,
            segment: leadData.segment,
            teamSize: leadData.teamSize,
            revenue: leadData.revenue,
            formOrigin: leadData.formOrigin,
            source: leadData.source
        });

        if (!leadData.name && !leadData.phone && !leadData.email) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'At least name, phone, or email is required'
            });
        }

        // Check if lead already exists (by phone or email)
        let existingConversationId = null;

        if (leadData.phone) {
            const phoneNormalized = leadData.phone.replace(/\D/g, '');
            const existingByPhone = await db.ref('conversations')
                .orderByChild('leadPhone')
                .equalTo(phoneNormalized)
                .once('value');

            if (existingByPhone.exists()) {
                const convs = existingByPhone.val();
                existingConversationId = Object.keys(convs)[0];
            }
        }

        const timestamp = Date.now();

        if (existingConversationId) {
            // Update existing conversation
            const conversationRef = db.ref(`conversations/${existingConversationId}`);

            // Add a system message about the new form submission
            const messagesRef = db.ref(`messages/${existingConversationId}`);
            const newMsgRef = messagesRef.push();

            const systemMessage = {
                id: newMsgRef.key,
                content: formatFormSubmissionMessage(leadData),
                senderId: 'system',
                direction: 'in',
                timestamp: timestamp,
                status: 'received',
                type: 'text',
                isSystemMessage: true
            };

            await newMsgRef.set(systemMessage);

            // Update conversation
            await conversationRef.update({
                lastMessage: systemMessage,
                unreadCount: admin.database.ServerValue.increment(1),
                updatedAt: timestamp,
                // Update any new info
                ...(leadData.company && { leadCompany: leadData.company }),
                ...(leadData.email && { leadEmail: leadData.email }),
                // Add new tags
                tags: admin.database.ServerValue.increment(0) // We'll handle tags separately
            });

            // Add form-specific tags
            await addTagsToConversation(existingConversationId, leadData.tags);

            console.log(`Updated existing conversation ${existingConversationId}`);

            return res.status(200).json({
                success: true,
                message: 'Lead updated',
                conversationId: existingConversationId,
                isNew: false
            });

        } else {
            const firestore = admin.firestore();

            // Create new conversation (Realtime DB)
            const conversationsRef = db.ref('conversations');
            const newConvRef = conversationsRef.push();
            const conversationId = newConvRef.key;

            // Create initial system message
            const messagesRef = db.ref(`messages/${conversationId}`);
            const newMsgRef = messagesRef.push();

            const initialMessage = {
                id: newMsgRef.key,
                content: formatFormSubmissionMessage(leadData),
                senderId: 'system',
                direction: 'in',
                timestamp: timestamp,
                status: 'received',
                type: 'text',
                isSystemMessage: true
            };

            await newMsgRef.set(initialMessage);

            // Create conversation
            const conversationData = {
                // ... fields
                leadId: `form_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                leadName: leadData.name || 'Lead sem nome',
                leadPhone: leadData.phone?.replace(/\D/g, '') || '',
                leadEmail: leadData.email || '',
                leadCompany: leadData.company || '',
                tags: leadData.tags || ['Novo', 'Formulário'],
                notes: leadData.notes || '',
                unreadCount: 1,
                channel: 'form',
                status: 'open',
                source: leadData.source || 'website',
                customFields: {
                    teamSize: leadData.teamSize || null,
                    revenue: leadData.revenue || null,
                    challenge: leadData.challenge || null,
                    formOrigin: leadData.formOrigin || 'unknown'
                },
                lastMessage: initialMessage,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            await newConvRef.set(conversationData);

            // Create Lead in Firestore (CRM)
            try {
                const now = new Date();
                const cleanPhone = conversationData.leadPhone;

                // Only create if we have at least a name
                if (conversationData.leadName) {
                    const leadsRef = firestore.collection('leads');

                    // Check duplicate by phone if exists
                    let existingLeadId = null;
                    if (cleanPhone) {
                        const q = await leadsRef.where('phone', '==', cleanPhone).get();
                        if (!q.empty) {
                            existingLeadId = q.docs[0].id;
                        }
                    }

                    if (existingLeadId) {
                        // UPDATE existing lead with new customFields
                        await leadsRef.doc(existingLeadId).update({
                            company: conversationData.leadCompany || undefined,
                            email: conversationData.leadEmail || undefined,
                            customFields: {
                                instagram: leadData.instagram || null,
                                segment: leadData.segment || null,
                                teamSize: leadData.teamSize || null,
                                revenue: leadData.revenue || null,
                                challenge: leadData.challenge || null,
                                formOrigin: leadData.formOrigin || 'website',
                                utmSource: leadData.source || null
                            },
                            updatedAt: now,
                        });
                        console.log(`Updated existing CRM lead: ${existingLeadId}`);
                    } else {
                        // CREATE new lead
                        await leadsRef.add({
                            name: conversationData.leadName,
                            phone: conversationData.leadPhone,
                            email: conversationData.leadEmail,
                            company: conversationData.leadCompany,
                            pipeline: 'venda',
                            status: 'ht-novo',
                            order: 0,
                            estimatedValue: 0,
                            tags: conversationData.tags,
                            responsibleId: 'admin',
                            source: leadData.source || 'form',
                            customFields: {
                                instagram: leadData.instagram || null,
                                segment: leadData.segment || null,
                                teamSize: leadData.teamSize || null,
                                revenue: leadData.revenue || null,
                                challenge: leadData.challenge || null,
                                formOrigin: leadData.formOrigin || 'website',
                                utmSource: leadData.source || null
                            },
                            createdAt: now,
                            updatedAt: now,
                        });
                        console.log(`Created new CRM lead from form: ${conversationData.leadName}`);
                    }
                }
            } catch (err) {
                console.error('Failed to auto-create CRM lead:', err);
            }

            console.log(`Created new conversation ${conversationId}`);

            // Optional: Send welcome message via WhatsApp
            if (leadData.phone && leadData.sendWelcomeMessage) {
                await sendWelcomeWhatsApp(leadData.phone, leadData.name);
            }

            return res.status(201).json({
                success: true,
                message: 'Lead created',
                conversationId: conversationId,
                isNew: true
            });
        }

    } catch (error) {
        console.error('Create lead error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}

/**
 * Normalize lead data from different form formats
 */
function normalizeLeadData(data) {
    // Map common field variations to standard names
    const fieldMappings = {
        name: ['name', 'nome', 'seu_nome', 'seuNome', 'fullName', 'full_name'],
        email: ['email', 'e-mail', 'emailCorporativo', 'email_corporativo', 'corporateEmail'],
        phone: ['phone', 'telefone', 'whatsapp', 'cel', 'celular', 'mobile', 'fone'],
        company: ['company', 'empresa', 'nomeEmpresa', 'nome_empresa', 'companyName'],
        instagram: ['instagram', 'insta', 'ig', 'instagram_empresa'],
        segment: ['segment', 'segmento', 'nicho', 'setor', 'categoria'],
        teamSize: ['teamSize', 'tamanhoEquipe', 'tamanho_equipe', 'team_size', 'employees'],
        revenue: ['revenue', 'faturamento', 'faturamentoEmpresa', 'faturamento_empresa', 'billing', 'budget'],
        challenge: ['challenge', 'desafio', 'maiorDesafio', 'maior_desafio', 'problem', 'mensagem', 'message', 'projeto', 'goal'],
        source: ['source', 'origem', 'utm_source', 'referrer'],
        formOrigin: ['formOrigin', 'form_origin', 'form', 'formId', 'form_id']
    };

    const normalized = {};

    for (const [standardField, variations] of Object.entries(fieldMappings)) {
        for (const variation of variations) {
            if (data[variation]) {
                normalized[standardField] = data[variation];
                break;
            }
        }
    }

    // Determine tags based on form origin or source
    normalized.tags = ['Novo', 'Formulário'];

    const origin = (data.formOrigin || data.form_origin || data.source || '').toLowerCase();

    if (origin.includes('proposta') || origin.includes('proposal')) {
        normalized.tags.push('LP-Proposta');
    } else if (origin.includes('social') || origin.includes('instagram')) {
        normalized.tags.push('LP-Social-Media');
    } else if (origin.includes('site') || origin.includes('contato')) {
        normalized.tags.push('Site');
    }

    // Check for qualification level
    if (normalized.revenue || normalized.teamSize) {
        normalized.tags.push('Qualificado');
    }

    return normalized;
}

/**
 * Format the form submission as a readable message
 */
function formatFormSubmissionMessage(data) {
    const lines = ['📋 *Novo Lead via Formulário*', ''];

    if (data.name) lines.push(`👤 Nome: ${data.name}`);
    if (data.email) lines.push(`📧 Email: ${data.email}`);
    if (data.phone) lines.push(`📱 WhatsApp: ${data.phone}`);
    if (data.company) lines.push(`🏢 Empresa: ${data.company}`);
    if (data.teamSize) lines.push(`👥 Equipe: ${data.teamSize}`);
    if (data.revenue) lines.push(`💰 Faturamento: ${data.revenue}`);

    if (data.challenge) {
        lines.push('');
        lines.push(`💬 Mensagem/Desafio:`);
        lines.push(data.challenge);
    }

    if (data.tags && data.tags.length > 0) {
        lines.push('');
        lines.push(`🏷️ Tags: ${data.tags.join(', ')}`);
    }

    return lines.join('\n');
}

/**
 * Add tags to an existing conversation
 */
async function addTagsToConversation(conversationId, newTags) {
    if (!newTags || newTags.length === 0) return;

    const conversationRef = db.ref(`conversations/${conversationId}`);
    const snapshot = await conversationRef.child('tags').once('value');
    const existingTags = snapshot.val() || [];

    // Merge tags, avoiding duplicates
    const mergedTags = [...new Set([...existingTags, ...newTags])];

    await conversationRef.update({ tags: mergedTags });
}

/**
 * Send a welcome message via WhatsApp (optional)
 */
async function sendWelcomeWhatsApp(phone, name) {
    try {
        const apiKey = process.env.WHATSAPP_API_KEY;
        const baseUrl = process.env.WHATSAPP_API_URL;

        if (!apiKey || !baseUrl) {
            console.log('WhatsApp credentials not configured, skipping welcome message');
            return;
        }

        const phoneNormalized = phone.replace(/\D/g, '');
        const greeting = name ? `Olá ${name.split(' ')[0]}!` : 'Olá!';

        const response = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'D360-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNormalized,
                type: 'text',
                text: {
                    body: `${greeting} Recebemos sua solicitação e em breve um consultor entrará em contato. 🚀\n\n- Equipe Nobre Marketing`
                }
            })
        });

        if (response.ok) {
            console.log('Welcome message sent successfully');
        } else {
            console.log('Failed to send welcome message:', await response.text());
        }
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}
