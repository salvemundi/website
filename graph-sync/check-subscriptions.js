
import 'dotenv/config';
import axios from 'axios';

async function getAccessToken() {
    const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return tokenResponse.data.access_token;
}

async function listSubscriptions(token) {
    const response = await axios.get('https://graph.microsoft.com/v1.0/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n--- Current Graph Subscriptions ---');
    if (response.data.value.length === 0) {
        console.log('No active subscriptions found.');
    } else {
        response.data.value.forEach(sub => {
            console.log(`ID: ${sub.id}`);
            console.log(`Resource: ${sub.resource}`);
            console.log(`CallbackURL: ${sub.notificationUrl}`);
            console.log(`Expiration: ${sub.expirationDateTime}`);
            console.log(`ChangeType: ${sub.changeType}`);
            console.log('---');
        });
    }
}

async function createSubscription(token, resource, webhookUrl) {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 4230); // ~3 days (max for users)

    const payload = {
        changeType: 'updated,deleted',
        notificationUrl: webhookUrl,
        resource: resource,
        expirationDateTime: expiration.toISOString(),
        clientState: process.env.WEBHOOK_CLIENT_STATE || 'secret'
    };

    try {
        const response = await axios.post('https://graph.microsoft.com/v1.0/subscriptions', payload, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        console.log(`✅ Subscription created for ${resource}! ID: ${response.data.id}`);
    } catch (error) {
        console.error(`❌ Failed to create subscription for ${resource}:`, error.response?.data || error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'list';
    const webhookUrl = args[1];

    try {
        const token = await getAccessToken();

        if (command === 'list') {
            await listSubscriptions(token);
        } else if (command === 'create') {
            if (!webhookUrl) {
                console.error('Usage: node check-subscriptions.js create <PUBLIC_WEBHOOK_URL>');
                process.exit(1);
            }
            // Create for both users and groups to be sure
            await createSubscription(token, 'users', webhookUrl);
            await createSubscription(token, 'groups', webhookUrl);
        } else {
            console.log('Unknown command. Use "list" or "create <url>".');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
