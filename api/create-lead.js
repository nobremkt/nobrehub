/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CREATE-LEAD API — Receive form submissions and create leads in Supabase
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This Vercel serverless function handles form submissions from:
 *   - Landing pages (LP)
 *   - Website contact forms
 *   - Any external source
 *
 * Flow:
 *   1. Parse and normalize form data
 *   2. Check for duplicate (by phone)
 *   3. Create or update lead in Supabase `leads` table
 *   4. Auto-distribute to a salesperson (Least Loaded)
 *   5. Lead appears in the Kanban — NO conversation is auto-created
 *   6. Salesperson initiates conversation from the Kanban when ready
 *
 * Environment variables required:
 *   - SUPABASE_URL (or VITE_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getServiceClient, setCorsHeaders } from './_lib/integrationHelper.js';
import { getLeastLoadedAssignee } from './_lib/distributionHelper.js';

// ─── Source & Tag Configuration ──────────────────────────────────────────────

/** Official lead sources — validated enum */
const VALID_SOURCES = ['whatsapp', 'landing-page', 'instagram', 'indicacao', 'site', 'manual'];

/** Map formOrigin → auto-generated tags */
const FORM_ORIGIN_TAGS = {
    'lp-social-media': 'LP-Social-Media',
    'captacao-social-media': 'LP-Captação',
    'site-contato': 'Site',
};

/** Map formOrigin → source (fallback when source is not explicitly sent) */
const FORM_ORIGIN_SOURCE = {
    'lp-social-media': 'landing-page',
    'captacao-social-media': 'landing-page',
    'site-contato': 'site',
};

/** Map formOrigin → pipeline (high-ticket for social media products, low-ticket for general site) */
const FORM_ORIGIN_PIPELINE = {
    'lp-social-media': 'high-ticket',
    'captacao-social-media': 'high-ticket',
    'site-contato': 'low-ticket',
};
const DEFAULT_PIPELINE = 'low-ticket';

// ─── Main Handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse body — handle both JSON and form-urlencoded
        let data = req.body;
        if (typeof data === 'string') {
            const params = new URLSearchParams(data);
            data = Object.fromEntries(params.entries());
        }

        console.log('[CreateLead] Data received:', JSON.stringify(data, null, 2));

        // Normalize fields from different form formats
        const leadData = normalizeLeadData(data);
        console.log('[CreateLead] Normalized:', JSON.stringify(leadData, null, 2));

        if (!leadData.name && !leadData.phone && !leadData.email) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'At least name, phone, or email is required',
            });
        }

        const supabase = getServiceClient();
        const cleanPhone = (leadData.phone || '').replace(/\D/g, '');
        const now = new Date().toISOString();

        // ── Check for existing lead by phone ────────────────────────────────
        let existingLead = null;

        if (cleanPhone) {
            const { data: found } = await supabase
                .from('leads')
                .select('id, name, tags')
                .eq('phone', cleanPhone)
                .limit(1)
                .maybeSingle();

            existingLead = found;
        }

        if (existingLead) {
            // ── UPDATE existing lead ────────────────────────────────────────
            const existingTags = existingLead.tags || [];
            const mergedTags = [...new Set([...existingTags, ...(leadData.tags || [])])];

            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    ...(leadData.company && { company: leadData.company }),
                    ...(leadData.email && { email: leadData.email }),
                    source: leadData.source,
                    tags: mergedTags,
                    custom_fields: buildCustomFields(leadData),
                    updated_at: now,
                })
                .eq('id', existingLead.id);

            if (updateError) {
                console.error('[CreateLead] Update error:', updateError.message);
                throw updateError;
            }

            // Log activity
            await logActivity(supabase, existingLead.id, 'form_submission', leadData);

            console.log(`[CreateLead] Updated existing lead ${existingLead.id}`);
            return res.status(200).json({
                success: true,
                message: 'Lead updated',
                leadId: existingLead.id,
                isNew: false,
            });
        }

        // ── CREATE new lead ─────────────────────────────────────────────────

        // Resolve pipeline from formOrigin (social media → high-ticket, site → low-ticket)
        const formOrigin = (leadData.formOrigin || '').toLowerCase();
        const pipeline = FORM_ORIGIN_PIPELINE[formOrigin] || DEFAULT_PIPELINE;
        const firstStageId = await getFirstStageId(supabase, pipeline);

        // Auto-distribute: find the salesperson with fewest active leads
        const responsibleId = await getNextSalesperson(supabase);

        const { data: newLead, error: insertError } = await supabase
            .from('leads')
            .insert({
                name: leadData.name || 'Lead sem nome',
                phone: cleanPhone,
                email: leadData.email || null,
                company: leadData.company || null,
                pipeline,
                stage_id: firstStageId,
                responsible_id: responsibleId,
                deal_status: 'open',
                source: leadData.source,
                temperature: 'warm',
                tags: leadData.tags || ['Novo', 'Formulário'],
                custom_fields: buildCustomFields(leadData),
                order: 0,
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[CreateLead] Insert error:', insertError.message);
            throw insertError;
        }

        // Log activity
        await logActivity(supabase, newLead.id, 'lead_created', leadData);

        console.log(`[CreateLead] Created lead ${newLead.id}, assigned to ${responsibleId || 'nobody'}`);

        return res.status(201).json({
            success: true,
            message: 'Lead created',
            leadId: newLead.id,
            isNew: true,
            assignedTo: responsibleId,
        });
    } catch (error) {
        console.error('[CreateLead] Error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalize lead data from different form formats.
 * Supports Portuguese and English field names.
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
        formOrigin: ['formOrigin', 'form_origin', 'form', 'formId', 'form_id'],
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
 * Build custom_fields JSONB from form data.
 */
function buildCustomFields(leadData) {
    return {
        instagram: leadData.instagram || null,
        segment: leadData.segment || null,
        teamSize: leadData.teamSize || null,
        revenue: leadData.revenue || null,
        challenge: leadData.challenge || null,
        formOrigin: leadData.formOrigin || 'unknown',
    };
}

/**
 * Get the first stage (lowest order) of a pipeline.
 * Returns the UUID of the stage or null.
 */
async function getFirstStageId(supabase, pipeline) {
    const { data, error } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline', pipeline)
        .eq('active', true)
        .order('order', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn('[CreateLead] Could not fetch pipeline stages:', error.message);
        return null;
    }

    return data?.id || null;
}

/**
 * Get the next salesperson to assign using "Least Loaded" strategy.
 * Dynamically discovers all active users with the "Vendedor(a)" role.
 * Reads enabled/strategy from `settings` table (key: leadDistribution).
 * Returns user UUID or null if distribution is disabled or no salespeople exist.
 */
async function getNextSalesperson(supabase) {
    return getLeastLoadedAssignee(supabase, '[CreateLead] Distribution');
}

/**
 * Log a lead activity (for the Lead 360° timeline).
 */
async function logActivity(supabase, leadId, type, leadData) {
    try {
        const description =
            type === 'lead_created'
                ? `Lead criado via formulário (${leadData.formOrigin || 'direto'})`
                : `Formulário preenchido novamente (${leadData.formOrigin || 'direto'})`;

        await supabase.from('lead_activities').insert({
            lead_id: leadId,
            type,
            description,
            metadata: {
                source: leadData.source,
                formOrigin: leadData.formOrigin,
                tags: leadData.tags,
            },
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        // Non-critical — don't fail the entire request
        console.warn('[CreateLead] Activity log failed:', err.message);
    }
}
