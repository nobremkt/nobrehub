/**
 * One-time script to create Supabase Auth accounts for users that only exist in public.users.
 * Links existing public.users rows to new auth.users entries.
 * 
 * Usage: $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/create-auth-accounts.mjs
 */

const SUPABASE_URL = 'https://xedfkizltrervaltuzrx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
}

const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
};

async function main() {
    // 1. Load all public.users
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?select=id,name,email,plain_password&plain_password=not.is.null&order=name`,
        { headers }
    );
    const users = await res.json();
    console.log(`Found ${users.length} users in public.users\n`);

    // 2. Check which have auth accounts already
    const authRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?per_page=100`,
        { headers }
    );
    const authData = await authRes.json();
    const authEmails = new Set((authData.users || []).map(u => u.email));
    console.log(`Found ${authEmails.size} auth accounts\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
        if (authEmails.has(user.email)) {
            console.log(`⏭️  ${user.name} (${user.email}) — already has auth account`);
            skipped++;
            continue;
        }

        // Create auth account with matching ID
        try {
            const createRes = await fetch(
                `${SUPABASE_URL}/auth/v1/admin/users`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        id: user.id,  // Use same ID as public.users
                        email: user.email,
                        password: user.plain_password,
                        email_confirm: true,
                        user_metadata: { name: user.name },
                    }),
                }
            );

            const result = await createRes.json();

            if (createRes.ok) {
                console.log(`✅ ${user.name} (${user.email}) — auth account created`);
                created++;
            } else {
                // If ID conflict, the auth account exists with a different email or vice versa
                console.error(`❌ ${user.name} (${user.email}) — ${result.msg || result.message || JSON.stringify(result)}`);
                failed++;
            }
        } catch (err) {
            console.error(`❌ ${user.name}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped} (already existed)`);
    console.log(`Failed:  ${failed}`);
}

main();
