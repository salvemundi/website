const axios = require('axios');

async function provisionMember(membershipApiUrl, userId) {
    if (!userId) return;

    try {
        await axios.post(`${membershipApiUrl}/register`, {
            user_id: userId
        }, { timeout: 30000 });
    } catch (error) {
        console.error(`[MembershipService] Provisioning failed: ${error.message}`);
    }
}

async function createMember(membershipApiUrl, firstName, lastName, email) {
    try {
        const response = await axios.post(`${membershipApiUrl}/create-user`, {
            first_name: firstName,
            last_name: lastName,
            personal_email: email
        }, { timeout: 30000 });
        return response.data;
    } catch (error) {
        console.error(`[MembershipService] User creation failed: ${error.message}`);
        return null;
    }
}

async function syncUserToDirectus(graphSyncUrl, azureUserId) {
    if (!azureUserId || !graphSyncUrl) {
        console.warn(`[MembershipService] Skipping sync - missing azureUserId or graphSyncUrl`);
        return;
    }

    try {
        console.log(`[MembershipService] Triggering graph-sync for user: ${azureUserId}`);
        await axios.post(`${graphSyncUrl}/sync/user`, {
            userId: azureUserId
        }, { timeout: 10000 });
        console.log(`[MembershipService] Successfully triggered sync for user: ${azureUserId}`);
    } catch (error) {
        console.error(`[MembershipService] Graph sync failed for ${azureUserId}: ${error.message}`);
        // Don't throw - sync failure shouldn't break the main flow
    }
}

module.exports = {
    provisionMember,
    createMember,
    syncUserToDirectus
};