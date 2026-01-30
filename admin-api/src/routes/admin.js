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
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;

const DIRECTUS_HEADERS = {
    'Authorization': `Bearer ${DIRECTUS_API_TOKEN}`,
    'Content-Type': 'application/json'
};

// Helper for Graph Sync triggers
async function triggerUserSync(azureUserId) {
    if (!GRAPH_SYNC_URL || !azureUserId) return;
    try {
        await axios.post(`${GRAPH_SYNC_URL}/sync/user`, { userId: azureUserId }, { timeout: 10000 });
    } catch (err) {
        console.error(`[AdminAPI] Graph sync trigger failed for ${azureUserId}:`, err.message);
    }
}

// Routes

router.get('/pending-signups', async (req, res) => {
    try {
        const { status = 'pending', show_failed = 'false', type = 'all' } = req.query;

        const params = {
            'filter[environment][_eq]': 'development',
            'fields': 'id,created_at,product_name,amount,email,first_name,last_name,approval_status,payment_status,environment,user_id,registration,pub_crawl_signup,trip_signup',
            'sort': '-created_at',
            'limit': 100
        };

        if (status !== 'all') {
            params['filter[approval_status][_in]'] = status;
        } else {
            params['filter[approval_status][_in]'] = 'pending,rejected,approved,auto_approved';
        }

        if (show_failed !== 'true') {
            params['filter[payment_status][_eq]'] = 'paid';
        }

        if (type === 'membership_new') {
            params['filter[registration][_null]'] = 'true';
            params['filter[pub_crawl_signup][_null]'] = 'true';
            params['filter[trip_signup][_null]'] = 'true';
            params['filter[user_id][_null]'] = 'true';
        } else if (type === 'membership_renewal') {
            params['filter[registration][_null]'] = 'true';
            params['filter[pub_crawl_signup][_null]'] = 'true';
            params['filter[trip_signup][_null]'] = 'true';
            params['filter[user_id][_nnull]'] = 'true';
        } else if (type === 'event') {
            params['filter[registration][_nnull]'] = 'true';
        } else if (type === 'pub_crawl') {
            params['filter[pub_crawl_signup][_nnull]'] = 'true';
        } else if (type === 'trip') {
            params['filter[trip_signup][_nnull]'] = 'true';
        }

        const response = await axios.get(`${DIRECTUS_URL}/items/transactions`, {
            params,
            headers: DIRECTUS_HEADERS
        });

        res.json({ signups: response.data.data || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch signups' });
    }
});

router.post('/approve-signup/:id', async (req, res) => {
    const transactionId = req.params.id;
    try {
        const transaction = await directusService.getTransaction(DIRECTUS_URL, DIRECTUS_API_TOKEN, transactionId);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        if (transaction.approval_status === 'approved') return res.status(400).json({ error: 'Already approved' });
        if (transaction.payment_status !== 'paid') return res.status(400).json({ error: 'Payment not completed' });

        let userId = transaction.user_id;
        let firstName = transaction.first_name;
        let lastName = transaction.last_name;
        let email = transaction.email;
        let dateOfBirth = transaction.date_of_birth;
        let phoneNumber = null;

        if (transaction.transaction_id?.startsWith('tr_') && MOLLIE_API_KEY) {
            try {
                const molliePayment = await axios.get(`https://api.mollie.com/v2/payments/${transaction.transaction_id}`, {
                    headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` },
                    timeout: 5000
                });
                const meta = molliePayment.data.metadata || {};
                userId = userId || meta.userId;
                firstName = firstName || meta.firstName;
                lastName = lastName || meta.lastName;
                email = email || meta.email;
                dateOfBirth = dateOfBirth || meta.dateOfBirth;
                phoneNumber = phoneNumber || meta.phoneNumber;
            } catch (err) {
                console.warn('[AdminAPI] Mollie metadata fetch failed:', err.message);
            }
        }

        if (!userId && email) {
            const existing = await directusService.getUserByEmail(DIRECTUS_URL, DIRECTUS_API_TOKEN, email);
            if (existing) {
                console.log(`[AdminAPI] Found existing user by email ${email}: ${existing.id}`);
                userId = existing.id;
            }
        }

        if (userId) {
            const userData = await directusService.getUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, userId, 'id,entra_id,email,first_name,last_name');
            if (!userData) throw new Error(`User record ${userId} not found in Directus.`);

            const now = new Date();
            const expiryStr = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

            if (userData.entra_id) {
                // Scenario 1: User exists and has Entra ID. Just ensure they are active/provisioned.
                await membershipService.provisionMember(MEMBERSHIP_API_URL, userData.entra_id);

                await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', userId, {
                    membership_status: 'active',
                    membership_expiry: expiryStr
                });

                await triggerUserSync(userData.entra_id);
            } else {
                // Scenario 2: User exists in Directus but has no Entra ID linked yet.
                // We must create an Entra account for them to be a member.
                const credentials = await membershipService.createMember(MEMBERSHIP_API_URL, firstName || userData.first_name, lastName || userData.last_name, email || userData.email, phoneNumber, dateOfBirth);

                await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', userId, {
                    status: 'active',
                    membership_status: 'active',
                    membership_expiry: expiryStr,
                    entra_id: credentials.user_id,
                    phone_number: phoneNumber || undefined,
                    date_of_birth: dateOfBirth || undefined
                });

                await triggerUserSync(credentials.user_id);
                if (EMAIL_SERVICE_URL) {
                    await notificationService.sendWelcomeEmail(EMAIL_SERVICE_URL, email || userData.email, firstName || userData.first_name, credentials);
                }
            }
        } else if (firstName && lastName && email) {
            // Scenario 3: Complete new user.
            const credentials = await membershipService.createMember(MEMBERSHIP_API_URL, firstName, lastName, email, phoneNumber, dateOfBirth);
            const now = new Date();
            const expiryStr = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

            await directusService.createDirectusUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, {
                first_name: firstName,
                last_name: lastName,
                email: email,
                status: 'active',
                membership_status: 'active',
                membership_expiry: expiryStr,
                entra_id: credentials.user_id,
                phone_number: phoneNumber,
                date_of_birth: dateOfBirth
            });

            await triggerUserSync(credentials.user_id);

            if (EMAIL_SERVICE_URL) {
                await notificationService.sendWelcomeEmail(EMAIL_SERVICE_URL, email, firstName, credentials);
            }
        } else {
            return res.status(400).json({ error: 'Insufficient user data' });
        }

        await directusService.updateDirectusTransaction(DIRECTUS_URL, DIRECTUS_API_TOKEN, transactionId, {
            approval_status: 'approved',
            approved_by: req.user.id,
            approved_at: new Date().toISOString()
        });

        res.json({ success: true, message: 'Signup approved' });
    } catch (error) {
        let errorMsg = error.message;
        let details = null;

        if (error.response) {
            // Internal call failed (Axios error)
            errorMsg = `Internal Service Error: ${error.config?.url || 'Unknown URL'} returned ${error.response.status}`;
            details = error.response.data;
            console.error('[AdminAPI] Service call failed:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response.status,
                data: JSON.stringify(error.response.data, null, 2)
            });
        } else {
            console.error('[AdminAPI] Approval error:', error.stack || error.message);
        }

        res.status(500).json({
            error: 'Approval failed',
            message: errorMsg,
            details: details
        });
    }
});

router.post('/reject-signup/:id', async (req, res) => {
    try {
        await directusService.updateDirectusTransaction(DIRECTUS_URL, DIRECTUS_API_TOKEN, req.params.id, {
            approval_status: 'rejected',
            approved_by: req.user.id,
            approved_at: new Date().toISOString()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Rejection failed' });
    }
});

// Proxy routes for graph-sync (Committees)
router.get('/committees/list', async (req, res) => {
    try {
        const response = await axios.get(`${GRAPH_SYNC_URL}/committees/list`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list committees' });
    }
});

router.get('/groups/:groupId/members', async (req, res) => {
    try {
        const response = await axios.get(`${GRAPH_SYNC_URL}/groups/${req.params.groupId}/members`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list members' });
    }
});

router.post('/groups/:groupId/members', async (req, res) => {
    try {
        const response = await axios.post(`${GRAPH_SYNC_URL}/groups/${req.params.groupId}/members`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add member' });
    }
});

router.delete('/groups/:groupId/members/:userId', async (req, res) => {
    try {
        const response = await axios.delete(`${GRAPH_SYNC_URL}/groups/${req.params.groupId}/members/${req.params.userId}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

router.patch('/committees/members/:membershipId', async (req, res) => {
    try {
        const response = await axios.patch(`${GRAPH_SYNC_URL}/committees/members/${req.params.membershipId}`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update membership' });
    }
});

router.post('/sync-users', async (req, res) => {
    try {
        const response = await axios.post(`${GRAPH_SYNC_URL}/sync/initial`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger sync' });
    }
});

router.get('/sync-status', async (req, res) => {
    try {
        const response = await axios.get(`${GRAPH_SYNC_URL}/sync/status`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

module.exports = router;
