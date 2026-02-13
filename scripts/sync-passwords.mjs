/**
 * One-time script to sync plain_password → Supabase Auth for all users.
 * Uses the create-user edge function with action: 'update_password'.
 * 
 * Usage: node scripts/sync-passwords.mjs
 */

const SUPABASE_URL = 'https://xedfkizltrervaltuzrx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// We need the service role key to read users, but the edge function handles auth updates
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
}

async function main() {
    // 1. Fetch all users with plain_password
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?select=id,name,email,plain_password&plain_password=not.is.null&order=name`,
        {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
        }
    );

    if (!res.ok) {
        console.error('Failed to fetch users:', await res.text());
        process.exit(1);
    }

    const users = await res.json();
    console.log(`Found ${users.length} users with plain_password set.\n`);

    let success = 0;
    let failed = 0;

    for (const user of users) {
        if (!user.plain_password) continue;

        try {
            const resp = await fetch(
                `${SUPABASE_URL}/functions/v1/create-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'apikey': SUPABASE_SERVICE_KEY,
                    },
                    body: JSON.stringify({
                        action: 'update_password',
                        user_id: user.id,
                        password: user.plain_password,
                    }),
                }
            );

            const result = await resp.json();

            if (result.success) {
                const warning = result.authWarning ? ` ⚠️ ${result.authWarning}` : ' ✅';
                console.log(`${user.name} (${user.email})${warning}`);
                success++;
            } else {
                console.error(`❌ ${user.name}: ${result.error}`);
                failed++;
            }
        } catch (err) {
            console.error(`❌ ${user.name}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone: ${success} synced, ${failed} failed.`);
}

main();
