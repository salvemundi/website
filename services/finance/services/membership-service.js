const axios = require('axios');

const jwt = require('jsonwebtoken');

/**
 * Helper to get headers for internal service-to-service communication.
 * Includes JWT token and Correlation ID for tracing.
 */
function getInternalHeaders(correlationId = null) {
    const secret = process.env.SERVICE_SECRET;
    if (!secret) {
        console.error('❌ SERVICE_SECRET is not set for signing internal tokens!');
    }

    const token = jwt.sign({ iss: 'finance' }, secret || 'placeholder', { expiresIn: '5m' });

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    if (correlationId) {
        headers['X-Correlation-ID'] = correlationId;
    }

    return headers;
}

async function provisionMember(membershipApiUrl, userId, correlationId = null) {
    if (!userId) return;

    try {
        await axios.post(`${membershipApiUrl}/register`, {
            user_id: userId
        }, {
            headers: getInternalHeaders(correlationId),
            timeout: 30000
        });
    } catch (error) {
        console.error(`[MembershipService] Provisioning failed: ${error.message}`);
        throw error;
    }

}

async function createMember(membershipApiUrl, firstName, lastName, email, phoneNumber = null, dateOfBirth = null, correlationId = null) {
    try {
        const payload = {
            first_name: firstName,
            last_name: lastName,
            personal_email: email
        };
        if (phoneNumber) payload.phone_number = phoneNumber;
        if (dateOfBirth) payload.date_of_birth = dateOfBirth;

        const response = await axios.post(`${membershipApiUrl}/create-user`, payload, {
            headers: getInternalHeaders(correlationId),
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        console.error(`[MembershipService] User creation failed:`, error.message);
        if (error.response) {
            console.error(`[MembershipService] Response status:`, error.response.status);
            console.error(`[MembershipService] Response data:`, error.response.data);
        }
        throw new Error(`Membership API error: ${error.response?.data?.detail || error.message}`);
    }
}

async function syncUserToDirectus(graphSyncUrl, azureUserId, correlationId = null) {
    if (!azureUserId || !graphSyncUrl) {
        console.warn(`[MembershipService] Skipping sync - missing azureUserId or graphSyncUrl`);
        return;
    }

    try {
        console.log(`[MembershipService] Triggering graph-sync for user: ${azureUserId}`);
        await axios.post(`${graphSyncUrl}/sync/user`, {
            userId: azureUserId
        }, {
            headers: getInternalHeaders(correlationId),
            timeout: 10000
        });
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