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

// ═══════════════════════════════════════════════════════════════
// Source & Tag Configuration
// ═══════════════════════════════════════════════════════════════

/** Official lead sources — validated enum */
const VALID_SOURCES = ['whatsapp', 'landing-page', 'instagram', 'indicacao', 'site', 'manual'];

/** Map formOrigin → auto-generated tags */
const FORM_ORIGIN_TAGS = {
    'lp-social-media': 'LP-Social-Media',
    'captacao-social-media': 'LP-Captação',
    'lp-proposta': 'LP-Proposta',
    'site-contato': 'Site',
    'site-institucional': 'Site',
};

/** Map formOrigin → source (fallback when source is not explicitly sent) */
const FORM_ORIGIN_SOURCE = {
    'lp-social-media': 'landing-page',
    'captacao-social-media': 'landing-page',
    'lp-proposta': 'landing-page',
    'site-contato': 'site',
    'site-institucional': 'site',
};

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

        if (!leadData.name && !leadData.phone && !leadData.email) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'At least name, phone, or email is required'
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // Check for existing conversation in Firestore
        // ═══════════════════════════════════════════════════════════════

        let existingConversationId = null;

        if (leadData.phone) {
            const phoneNormalized = leadData.phone.replace(/\D/g, '');
            const existingQuery = await firestore
                .collection('conversations')
                .where('leadPhone', '==', phoneNormalized)
                .limit(1)
                .get();

            if (!existingQuery.empty) {
                existingConversationId = existingQuery.docs[0].id;
            }
        }

        const now = admin.firestore.Timestamp.now();

        if (existingConversationId) {
            // ═══════════════════════════════════════════════════════════
            // UPDATE existing conversation
            // ═══════════════════════════════════════════════════════════

            const conversationRef = firestore.collection('conversations').doc(existingConversationId);

            // Add a system message about the new form submission
            const systemMessage = {
                content: formatFormSubmissionMessage(leadData),
                senderId: 'system',
                direction: 'in',
                timestamp: now,
                status: 'received',
                type: 'text',
                isSystemMessage: true
            };

            await conversationRef.collection('messages').add(systemMessage);

            // Update conversation
            const convSnap = await conversationRef.get();
            const existingTags = convSnap.data()?.tags || [];

            // Merge tags
            const mergedTags = [...new Set([...existingTags, ...(leadData.tags || [])])];

            await conversationRef.update({
                lastMessage: systemMessage,
                unreadCount: admin.firestore.FieldValue.increment(1),
                updatedAt: now,
                tags: mergedTags,
                ...(leadData.company && { leadCompany: leadData.company }),
                ...(leadData.email && { leadEmail: leadData.email }),
            });

            console.log(`Updated existing conversation ${existingConversationId}`);

            return res.status(200).json({
                success: true,
                message: 'Lead updated',
                conversationId: existingConversationId,
                isNew: false
            });

        } else {
            // ═══════════════════════════════════════════════════════════
            // CREATE new conversation in Firestore
            // ═══════════════════════════════════════════════════════════

            const leadId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create initial system message
            const initialMessage = {
                content: formatFormSubmissionMessage(leadData),
                senderId: 'system',
                direction: 'in',
                timestamp: now,
                status: 'received',
                type: 'text',
                isSystemMessage: true
            };

            // Create conversation
            const conversationData = {
                leadId: leadId,
                leadName: leadData.name || 'Lead sem nome',
                leadPhone: leadData.phone?.replace(/\D/g, '') || '',
                leadEmail: leadData.email || '',
                leadCompany: leadData.company || '',
                tags: leadData.tags || ['Novo', 'Formulário'],
                notes: leadData.notes || '',
                unreadCount: 1,
                channel: 'form',
                status: 'open',
                context: 'sales',
                source: leadData.source,
                customFields: {
                    teamSize: leadData.teamSize || null,
                    revenue: leadData.revenue || null,
                    challenge: leadData.challenge || null,
                    formOrigin: leadData.formOrigin || 'unknown'
                },
                lastMessage: initialMessage,
                createdAt: now,
                updatedAt: now,
            };

            const convRef = await firestore.collection('conversations').add(conversationData);
            const conversationId = convRef.id;

            // Add the initial message to subcollection
            await convRef.collection('messages').add(initialMessage);

            // ═══════════════════════════════════════════════════════════
            // Create Lead in Firestore (CRM)
            // ═══════════════════════════════════════════════════════════

            try {
                const cleanPhone = conversationData.leadPhone;

                if (conversationData.leadName) {
                    const leadsRef = firestore.collection('leads');

                    // Check duplicate by phone
                    let existingLeadId = null;
                    if (cleanPhone) {
                        const q = await leadsRef.where('phone', '==', cleanPhone).get();
                        if (!q.empty) {
                            existingLeadId = q.docs[0].id;
                        }
                    }

                    const crmCustomFields = {
                        instagram: leadData.instagram || null,
                        segment: leadData.segment || null,
                        teamSize: leadData.teamSize || null,
                        revenue: leadData.revenue || null,
                        challenge: leadData.challenge || null,
                        formOrigin: leadData.formOrigin || 'unknown',
                    };

                    if (existingLeadId) {
                        // UPDATE existing lead
                        await leadsRef.doc(existingLeadId).update({
                            company: conversationData.leadCompany || undefined,
                            email: conversationData.leadEmail || undefined,
                            source: leadData.source,
                            customFields: crmCustomFields,
                            updatedAt: now,
                        });
                        console.log(`Updated existing CRM lead: ${existingLeadId}`);
                    } else {
                        // CREATE new lead
                        await leadsRef.doc(leadId).set({
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
                            source: leadData.source,
                            customFields: crmCustomFields,
                            createdAt: now,
                            updatedAt: now,
                        });
                        console.log(`Created new CRM lead with ID: ${leadId}`);
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

    // ── Resolve source (explicit > derived from formOrigin > fallback) ──
    const formOrigin = (normalized.formOrigin || '').toLowerCase();

    if (!normalized.source || !VALID_SOURCES.includes(normalized.source)) {
        normalized.source = FORM_ORIGIN_SOURCE[formOrigin] || 'manual';
    }

    // ── Tags via lookup table ──
    normalized.tags = ['Novo', 'Formulário'];

    const formTag = FORM_ORIGIN_TAGS[formOrigin];
    if (formTag) {
        normalized.tags.push(formTag);
    }

    // Qualification tag
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
