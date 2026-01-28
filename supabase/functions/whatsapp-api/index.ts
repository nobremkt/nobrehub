// WhatsApp API Edge Function
// Handles sending messages and templates via 360Dialog

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 360Dialog API Configuration
const DIALOG360_API_URL = "https://waba-v2.360dialog.io";

// CORS headers for browser requests
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Helper: Make request to 360Dialog API
async function dialog360Request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const apiKey = Deno.env.get("DIALOG360_API_KEY");
    if (!apiKey) {
        throw new Error("DIALOG360_API_KEY not configured");
    }

    const url = `${DIALOG360_API_URL}${endpoint}`;
    console.log("📤 360Dialog Request:", url, options.method || "GET");

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "D360-API-KEY": apiKey,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ 360Dialog API Error:", response.status, JSON.stringify(error));
        throw new Error(`360Dialog API Error: ${JSON.stringify(error)}`);
    }

    return response.json() as Promise<T>;
}

// Helper: Push to Firebase Realtime DB
async function pushToFirebase(path: string, data: any): Promise<void> {
    const firebaseUrl = Deno.env.get("FIREBASE_DATABASE_URL");
    if (!firebaseUrl) {
        console.warn("⚠️ FIREBASE_DATABASE_URL not set - skipping realtime push");
        return;
    }

    try {
        await fetch(`${firebaseUrl}/${path}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        console.log("🔥 Firebase push:", path);
    } catch (error) {
        console.error("❌ Firebase push error:", error);
    }
}

// Helper: Save message to Supabase
async function saveMessage(conversationId: string, leadId: string, text: string, direction: "in" | "out", phone: string, waMessageId?: string): Promise<any> {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const messageData = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        lead_id: leadId,
        phone,
        direction,
        type: "text",
        text,
        status: direction === "out" ? "sent" : "received",
        wa_message_id: waMessageId,
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

    if (error) {
        console.error("❌ Error saving message:", JSON.stringify(error));
        throw new Error(error.message || error.details || JSON.stringify(error));
    }

    return data;
}

// Handler: Send Text Message
async function handleSendMessage(body: any): Promise<Response> {
    const { to, text, conversationId, leadId } = body;

    if (!to || !text) {
        return new Response(JSON.stringify({ success: false, error: "Missing 'to' or 'text'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Format phone (remove non-digits)
    const formattedPhone = to.replace(/\D/g, "");

    try {
        // Send to 360Dialog
        const result = await dialog360Request<{ messages: Array<{ id: string }> }>("/messages", {
            method: "POST",
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formattedPhone,
                type: "text",
                text: { body: text },
            }),
        });

        const messageId = result.messages?.[0]?.id;
        console.log("✅ Message sent:", messageId);

        // Save to database if conversationId provided
        if (conversationId && leadId) {
            const savedMessage = await saveMessage(conversationId, leadId, text, "out", formattedPhone, messageId);

            // Push to Firebase for realtime
            await pushToFirebase(`conversations/${conversationId}/newMessage`, {
                id: savedMessage.id,
                content: text,
                text,
                sender: "agent",
                direction: "out",
                status: "sent",
                waMessageId: messageId,
                timestamp: Date.now(),
            });
        }

        return new Response(JSON.stringify({ success: true, messageId }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Send message error:", error);
        return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Handler: Send Template Message
async function handleSendTemplate(body: any): Promise<Response> {
    const { to, templateName, languageCode = "pt_BR", components = [], conversationId, leadId } = body;

    if (!to || !templateName) {
        return new Response(JSON.stringify({ success: false, error: "Missing 'to' or 'templateName'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const formattedPhone = to.replace(/\D/g, "");

    const templatePayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
        },
    };

    if (components.length > 0) {
        templatePayload.template.components = components;
    }

    try {
        const result = await dialog360Request<{ messages: Array<{ id: string }> }>("/messages", {
            method: "POST",
            body: JSON.stringify(templatePayload),
        });

        const messageId = result.messages?.[0]?.id;
        console.log("✅ Template sent:", messageId);

        // Save to database
        if (conversationId && leadId) {
            const savedMessage = await saveMessage(conversationId, leadId, `[Template: ${templateName}]`, "out", formattedPhone, messageId);

            await pushToFirebase(`conversations/${conversationId}/newMessage`, {
                id: savedMessage.id,
                content: `[Template: ${templateName}]`,
                text: `[Template: ${templateName}]`,
                sender: "agent",
                direction: "out",
                status: "sent",
                waMessageId: messageId,
                timestamp: Date.now(),
            });
        }

        return new Response(JSON.stringify({ success: true, messageId }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Send template error:", error);
        return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Handler: Get Templates
async function handleGetTemplates(): Promise<Response> {
    try {
        const result = await dialog360Request<{ waba_templates: any[] }>("/v1/configs/templates");
        const templates = result.waba_templates || [];

        console.log(`✅ Fetched ${templates.length} templates`);

        return new Response(JSON.stringify({ templates }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Get templates error:", error);
        return new Response(JSON.stringify({ templates: [], error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Main Handler
Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/whatsapp-api", "").replace("/functions/v1/whatsapp-api", "");

    console.log(`📨 WhatsApp API: ${req.method} ${path}`);

    try {
        // Route: GET /templates
        if (req.method === "GET" && (path === "/templates" || path === "")) {
            return handleGetTemplates();
        }

        // Route: POST /send
        if (req.method === "POST" && path === "/send") {
            const body = await req.json();
            return handleSendMessage(body);
        }

        // Route: POST /send-template
        if (req.method === "POST" && path === "/send-template") {
            const body = await req.json();
            return handleSendTemplate(body);
        }

        // 404 for unknown routes
        return new Response(JSON.stringify({ error: "Not found", path }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Edge Function error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
