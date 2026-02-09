const express = require('express');
const axios = require('axios');
const directusService = require('../services/directus');
const membershipService = require('../services/membership');
const notificationService = require('../services/notifications');

const router = express.Router();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;
const MEMBERSHIP_API_URL = process.env.MEMBERSHIP_API_URL;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;
const GRAPH_SYNC_URL = process.env.GRAPH_SYNC_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const INTERNAL_HEADERS = {
    'x-api-key': INTERNAL_API_KEY,
    'Content-Type': 'application/json'
};

// Helper for Graph Sync triggers
async function triggerUserSync(azureUserId) {
    if (!GRAPH_SYNC_URL || !azureUserId) return;
    try {
        await axios.post(`${GRAPH_SYNC_URL}/sync/user`, { userId: azureUserId }, {
            headers: INTERNAL_HEADERS,
            timeout: 10000
        });
    } catch (err) {
        console.error(`[InternalAPI] Graph sync trigger failed for ${azureUserId}:`, err.message);
    }
}

/**
 * Internal route for provisioning members.
 * Used by payment-api to delegate administrative tasks.
 */
router.post('/provision-member', async (req, res) => {
    const traceId = req.headers['x-trace-id'] || `int-${Math.random().toString(36).substring(7)}`;
    console.log(`[InternalAPI][${traceId}] Provision member request received`);

    try {
        const { userId, firstName, lastName, email, dateOfBirth, phoneNumber, description } = req.body;

        if (userId) {
            // SCENARIO: Renewal (Existing User)
            console.log(`[InternalAPI][${traceId}] Processing renewal for user ${userId}`);

            const userData = await directusService.getUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, userId, 'id,entra_id,email,first_name,last_name');
            if (!userData) throw new Error(`User record ${userId} not found in Directus.`);

            if (userData.entra_id) {
                await membershipService.provisionMember(MEMBERSHIP_API_URL, userData.entra_id);

                const now = new Date();
                const expiryStr = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

                await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', userId, {
                    membership_status: 'active',
                    membership_expiry: expiryStr
                });

                await triggerUserSync(userData.entra_id);

                // Send confirmation email
                if (EMAIL_SERVICE_URL) {
                    await notificationService.sendApprovalNotificationEmail(
                        EMAIL_SERVICE_URL,
                        email || userData.email,
                        firstName || userData.first_name,
                        false
                    );
                }

                return res.json({ success: true, message: 'Existing member provisioned' });
            } else {
                throw new Error(`User ${userId} has no Entra ID. Cannot provision via internal API.`);
            }
        } else if (firstName && lastName && email) {
            // SCENARIO: New User
            console.log(`[InternalAPI][${traceId}] Processing new user: ${email}`);

            const now = new Date();
            const expiryStr = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

            // 1. Create Directus user
            const directusUser = await directusService.createDirectusUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, {
                first_name: firstName,
                last_name: lastName,
                email: email,
                date_of_birth: dateOfBirth || null,
                phone_number: phoneNumber || null,
                status: 'active',
                membership_status: 'active',
                membership_expiry: expiryStr
            });

            // 2. Create membership account
            const credentials = await membershipService.createMember(MEMBERSHIP_API_URL, firstName, lastName, email, phoneNumber, dateOfBirth);

            // 3. Link Entra ID
            if (credentials && credentials.user_id) {
                await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', directusUser.id, {
                    entra_id: credentials.user_id
                });

                await triggerUserSync(credentials.user_id);

                // 4. Send welcome email
                if (EMAIL_SERVICE_URL) {
                    await notificationService.sendWelcomeEmail(
                        EMAIL_SERVICE_URL,
                        email,
                        firstName,
                        credentials
                    );
                }
            }

            return res.json({ success: true, message: 'New member created and provisioned', userId: directusUser.id });
        } else {
            return res.status(400).json({ error: 'Insufficient data for provisioning' });
        }
    } catch (error) {
        console.error(`[InternalAPI][${traceId}] Provisioning failed:`, error.message);
        return res.status(500).json({ error: 'Provisioning failed', details: error.message });
    }
});

module.exports = router;
