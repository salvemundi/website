const directusApiUrl = 'https://admin.salvemundi.nl';
const apiKey = process.env.DIRECTUS_ADMIN_TOKEN;

if (!apiKey) {
    console.error('❌ DIRECTUS_ADMIN_TOKEN environment variable is not set!');
    process.exit(1);
}

async function debugUser() {
    console.log('--- DEBUG USER PERMISSIONS ---');

    // 1. Find User ID for "Roan"
    console.log('Searching for user "Roan"...');
    const userRes = await fetch(`${directusApiUrl}/users?filter[first_name][_contains]=Roan&fields=id,first_name,last_name,role.name`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const { data: users } = await userRes.json();

    if (!users || users.length === 0) {
        console.error('User "Roan" not found.');
        return;
    }

    const user = users[0];
    console.log(`Found User: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    console.log(`Global Role: ${user.role?.name}`);

    // 2. Fetch Committee Memberships (Exactly like secure-check.ts)
    console.log('\nFetching memberships...');
    const query = `${directusApiUrl}/items/committee_members?fields=committee_id.name,committee_id.commissie_token,function&filter[user_id][_eq]=${user.id}`;

    const memberRes = await fetch(query, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const json = await memberRes.json();

    if (json.errors) {
        console.error('Directus Error:', JSON.stringify(json.errors, null, 2));
    } else {
        const memberships = json.data;
        console.log(`Found ${memberships.length} memberships:`);
        memberships.forEach((m: any) => {
            console.log(`- Committee: "${m.committee_id?.name}"`);
            console.log(`  Token:     "${m.committee_id?.commissie_token}"`);
            console.log(`  Function:  "${m.function}"`);
            console.log('---');
        });
    }
}

debugUser();
