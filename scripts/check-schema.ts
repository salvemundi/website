
const directusApiUrl = 'https://admin.salvemundi.nl';
const apiKey = 'wnislwHHiFbg5CuDkhahIcgO1v8FNUAw';

async function checkSchema() {
    console.log('Fetching schema for committee_members...');
    try {
        const response = await fetch(`${directusApiUrl}/fields/committee_members`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const json = await response.json();

        if (json.data) {
            console.log('--- FIELDS IN committee_members ---');
            json.data.forEach((f: any) => {
                console.log(`- ${f.field} (Type: ${f.type})`);
            });
            console.log('-----------------------------------');
        } else {
            console.log('Error fetching fields:', json);
        }
    } catch (e) {
        console.error('Failed to fetch:', e);
    }
}

checkSchema();
