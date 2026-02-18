const directusApiUrl = 'https://admin.salvemundi.nl';
const apiKey = process.env.DIRECTUS_ADMIN_TOKEN;

if (!apiKey) {
    console.error('❌ DIRECTUS_ADMIN_TOKEN environment variable is not set!');
    process.exit(1);
}

async function checkTokens() {
    console.log('Fetching committees from:', directusApiUrl);
    try {
        const response = await fetch(`${directusApiUrl}/items/committees?fields=name,commissie_token&limit=-1`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const json = await response.json();
        const committees = json.data;

        console.log('--- FOUND COMMITTEES ---');
        committees.forEach((c: any) => {
            console.log(`Name: "${c.name}" \t Token: "${c.commissie_token || '[LEEG]'}"`);
        });
        console.log('------------------------');
    } catch (e) {
        console.error('Failed to fetch:', e);
    }
}

checkTokens();
