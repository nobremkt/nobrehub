import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const body = await req.json();

        // ── Action: Update Password ──────────────────────────────────
        if (body.action === "update_password") {
            const { user_id, password } = body;
            if (!user_id || !password) {
                return new Response(
                    JSON.stringify({ error: "user_id and password are required" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Update auth password
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                user_id,
                { password }
            );
            if (authError) throw authError;

            // Also save plain password in users table
            const { error: dbError } = await supabaseAdmin
                .from("users")
                .update({ plain_password: password, updated_at: new Date().toISOString() })
                .eq("id", user_id);
            if (dbError) throw dbError;

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── Action: Create User ──────────────────────────────────────
        const { email, password, name, role_id, sector_id, phone, avatar_url, active } = body;

        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: "email and password are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Create user record in users table
        //    ONLY insert columns that exist in the schema:
        //    id, name, email, role_id, sector_id, phone, avatar_url, 
        //    active, plain_password, firebase_uid, created_at, updated_at
        const { error: dbError } = await supabaseAdmin.from("users").insert({
            id: userId,
            name: name || "",
            email,
            role_id: role_id || null,
            sector_id: sector_id || null,
            phone: phone || null,
            avatar_url: avatar_url || null,
            active: active ?? true,
            plain_password: password,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        if (dbError) {
            // Rollback: delete auth user if DB insert fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw new Error(`Failed to create user record: ${dbError.message}`);
        }

        return new Response(
            JSON.stringify({ user: { id: userId, email, name } }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
