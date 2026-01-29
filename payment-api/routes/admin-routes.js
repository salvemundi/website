const express = require('express');
const axios = require('axios');

module.exports = function (DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService, membershipService, GRAPH_SYNC_URL) {
    const router = express.Router();

    /**
     * Middleware: require admin access (user must have entra_id)
     */
    async function requireAdmin(req, res, next) {
        console.log('[AdminRoutes] requireAdmin called:', {
            hasAuthHeader: !!req.headers.authorization,
            authHeaderPreview: req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'NONE',
            path: req.path,
            method: req.method
        });

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.error('[AdminRoutes] No authorization header');
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('[AdminRoutes] Token extracted, length:', token.length);

        try {
            console.log('[AdminRoutes] Fetching user from Directus:', `${DIRECTUS_URL}/users/me`);
            const response = await axios.get(`${DIRECTUS_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = response.data.data;

            console.log('[AdminRoutes] User fetched:', {
                id: user.id,
                hasEntraId: !!user.entra_id,
                email: user.email
            });

            // Only users with entra_id (Fontys accounts) are admins
            if (!user.entra_id) {
                console.error('[AdminRoutes] User has no entra_id');
                return res.status(403).json({ error: 'Admin access required' });
            }

            req.user = user;
            console.log('[AdminRoutes] Admin check passed');
            next();
        } catch (error) {
            console.error('[AdminRoutes] Auth failed:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    /**
     * GET /api/admin/pending-signups
     * Fetch dev signups with filters
     * Query Params:
     * - status: 'pending' | 'approved' | 'rejected' | 'all' (default: 'pending')
     * - show_failed: 'true' | 'false' (default: 'false')
     */
    router.get('/pending-signups', requireAdmin, async (req, res) => {
        console.log('[AdminRoutes] GET /pending-signups called', req.query);
        try {
            const { status = 'pending', show_failed = 'false', type = 'all' } = req.query;

            // Base params
            const params = {
                'filter[environment][_eq]': 'development',
                'fields': 'id,created_at,product_name,amount,email,first_name,last_name,approval_status,payment_status,environment,user_id,registration,pub_crawl_signup,trip_signup',
                'sort': '-created_at',
                'limit': 100
            };


            if (status !== 'all') {
                // Allow comma separated or single status
                params['filter[approval_status][_in]'] = status;
            } else {
                params['filter[approval_status][_in]'] = 'pending,rejected,approved,auto_approved';
            }


            if (show_failed === 'true') {
                // Show everything (failed, open, expired, paid)
                // No filter needed on payment_status
            } else {
                // Default: Only paid
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

            console.log('[AdminRoutes] Fetching from Directus with params:', params);

            const response = await axios.get(
                `${DIRECTUS_URL}/items/transactions`,
                {
                    params: params,
                    headers: { 'Authorization': `Bearer ${DIRECTUS_API_TOKEN}` }
                }
            );

            res.json({ signups: response.data.data || [] });
        } catch (error) {
            console.error('[AdminRoutes] Failed to fetch signups:', {
                message: error.message,
                status: error.response?.status,
                directusError: error.response?.data
            });
            res.status(500).json({
                error: 'Failed to fetch signups',
                message: error.response?.data?.errors?.[0]?.message || error.message
            });
        }
    });

    /**
     * POST /api/admin/approve-signup/:id
     * Approve a signup and create account
     */
    router.post('/approve-signup/:id', requireAdmin, async (req, res) => {
        const transactionId = req.params.id;

        try {
            // Get full transaction details
            const transaction = await directusService.getTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionId
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (transaction.approval_status === 'approved') {
                return res.status(400).json({ error: 'Already approved' });
            }

            if (transaction.payment_status !== 'paid') {
                return res.status(400).json({ error: 'Payment not completed yet' });
            }

            // Extract user info - Prioritize Directus transaction fields
            let userId = transaction.user_id;
            let firstName = transaction.first_name;
            let lastName = transaction.last_name;
            let email = transaction.email;
            let dateOfBirth = transaction.date_of_birth;
            let phoneNumber = null; // Not typically stored in transaction table yet

            // Fetch from Mollie if we are missing essential data OR if we want extra metadata like phone number
            if (transaction.transaction_id && transaction.transaction_id.startsWith('tr_')) {
                // If we miss core data OR we just want to try getting phone number
                if ((!userId && (!firstName || !lastName || !email)) || !phoneNumber) {
                    console.log(`[AdminRoutes] Fetching additional metadata from Mollie: ${transaction.transaction_id}`);
                    try {
                        const molliePayment = await axios.get(
                            `https://api.mollie.com/v2/payments/${transaction.transaction_id}`,
                            {
                                headers: { 'Authorization': `Bearer ${process.env.MOLLIE_API_KEY}` },
                                timeout: 5000
                            }
                        );
                        const metadata = molliePayment.data.metadata || {};
                        userId = userId || metadata.userId;
                        firstName = firstName || metadata.firstName;
                        lastName = lastName || metadata.lastName;
                        email = email || metadata.email;
                        dateOfBirth = dateOfBirth || metadata.dateOfBirth;
                        phoneNumber = phoneNumber || metadata.phoneNumber;
                    } catch (error) {
                        console.error('[AdminRoutes] Could not fetch Mollie payment metadata:', error.message);
                    }
                }
            }

            // Create account based on user type
            if (userId) {
                console.log(`[AdminRoutes] Provisioning membership for EXISTING user (Directus ID): ${userId}`);
                try {
                    // Resolve Directus ID to Entra ID
                    const userData = await directusService.getUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, userId, 'entra_id');
                    let targetEntraId = null;

                    if (userData && userData.entra_id) {
                        targetEntraId = userData.entra_id;
                        console.log(`[AdminRoutes] Resolved Entra ID for ${userId}: ${targetEntraId}`);
                    } else {
                        console.warn(`[AdminRoutes] WARNING: Could not resolve Entra ID for user ${userId}. Assuming user is not linked to Azure correctly.`);
                        // We could throw here, but maybe we try with the ID we have or fail?
                        // membership-api REQUIRES an Object ID for Azure calls. Using Directus ID will fail.
                        throw new Error(`User ${userId} has no entra_id linked. Cannot update Azure attributes.`);
                    }

                    await membershipService.provisionMember(MEMBERSHIP_API_URL, targetEntraId);

                    await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, targetEntraId);
                } catch (provError) {
                    console.error(`[AdminRoutes] Provisioning FAILED for ${userId}:`, provError.message);
                    throw new Error(`Provisioning failed: ${provError.message}`);
                }
            } else if (firstName && lastName && email) {
                console.log(`[AdminRoutes] Creating NEW member account for: ${email}`);
                const credentials = await membershipService.createMember(
                    MEMBERSHIP_API_URL,
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    dateOfBirth
                );

                console.log(`[AdminRoutes] Account created. User ID: ${credentials.user_id}`);

                // Calculate expiry date (1 year from now)
                const now = new Date();
                const expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                const expiryStr = expiryDate.toISOString().split('T')[0];

                // Create Directus user immediately so the status is 'active' and linked to Entra
                try {
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
                    console.log(`[AdminRoutes] Created and linked Directus user for ${email}`);
                } catch (err) {
                    console.error(`[AdminRoutes] Failed to create/link Directus user:`, err.message);
                }

                // Trigger sync for newly created user
                if (credentials.user_id) {
                    await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, credentials.user_id);
                }

                // Send welcome email with credentials
                try {
                    await notificationService.sendWelcomeEmail(
                        EMAIL_SERVICE_URL,
                        email,
                        firstName,
                        credentials
                    );
                    console.log(`[AdminRoutes] Welcome email sent to: ${email}`);
                } catch (emailErr) {
                    console.error(`[AdminRoutes] Failed to send welcome email to ${email}:`, emailErr.message);
                    // Don't fail the whole request if only email fails, the account is created.
                }
            } else {
                console.warn(`[AdminRoutes] Insufficient data to create account for transaction ${transactionId}. Missing userId AND (name/email).`);
                return res.status(400).json({
                    error: 'Insufficient user data',
                    message: 'Cannot create account - missing user information (email/name)'
                });
            }

            // Mark as approved only after successful account creation
            await directusService.updateDirectusTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionId,
                {
                    approval_status: 'approved',
                    approved_by: req.user.id,
                    approved_at: new Date().toISOString()
                }
            );

            res.json({
                success: true,
                message: 'Signup approved and account created',
                transaction_id: transactionId
            });
        } catch (error) {
            console.error('[AdminRoutes] Approval failed:', error);
            console.error('[AdminRoutes] Error stack:', error.stack);
            res.status(500).json({ error: 'Failed to approve signup', details: error.message });
        }
    });

    /**
     * POST /api/admin/reject-signup/:id
     * Reject a signup (no account created)
     */
    router.post('/reject-signup/:id', requireAdmin, async (req, res) => {
        const transactionId = req.params.id;
        console.log(`[AdminRoutes] POST /reject-signup/${transactionId} called`);

        try {
            const transaction = await directusService.getTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionId
            );

            if (!transaction) {
                console.error(`[AdminRoutes] Transaction ${transactionId} not found`);
                return res.status(404).json({ error: 'Transaction not found' });
            }

            console.log(`[AdminRoutes] Transaction found. Status: ${transaction.approval_status}`);

            if (transaction.approval_status === 'rejected') {
                return res.status(400).json({ error: 'Already rejected' });
            }

            console.log(`[AdminRoutes] Updating transaction ${transactionId} to rejected...`);
            await directusService.updateDirectusTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionId,
                {
                    approval_status: 'rejected',
                    approved_by: req.user.id,
                    approved_at: new Date().toISOString()
                }
            );
            console.log(`[AdminRoutes] Transaction ${transactionId} rejected successfully`);

            res.json({
                success: true,
                message: 'Signup rejected',
                transaction_id: transactionId
            });
        } catch (error) {
            console.error('[AdminRoutes] Rejection failed:', error.message);
            res.status(500).json({ error: 'Failed to reject signup', details: error.message });
        }
    });

    /**
     * POST /api/admin/sync-users
     * Trigger a manual bulk sync from Entra ID to Directus
     */
    router.post('/sync-users', requireAdmin, async (req, res) => {
        console.log('[AdminRoutes] POST /sync-users called');
        try {
            // Trigger the sync in the background to avoid timeout
            // but return a 202 Accepted
            axios.post(`${GRAPH_SYNC_URL}/sync/initial`, req.body)
                .then(response => {
                    console.log('[AdminRoutes] Manual sync completed successfully:', response.data);
                })
                .catch(error => {
                    console.error('[AdminRoutes] Manual sync failed:', error.message);
                });

            res.status(202).json({
                success: true,
                message: 'Gebruiker synchronisatie gestart op de achtergrond'
            });
        } catch (error) {
            console.error('[AdminRoutes] Failed to initiate sync:', error.message);
            res.status(500).json({ error: 'Synchronisatie starten mislukt' });
        }
    });

    /**
     * GET /api/admin/sync-status
     * Get the current status of the manual user sync
     */
    router.get('/sync-status', requireAdmin, async (req, res) => {
        try {
            const response = await axios.get(`${GRAPH_SYNC_URL}/sync/status`);
            res.json(response.data);
        } catch (error) {
            console.error('[AdminRoutes] Failed to fetch sync status:', error.message);
            res.status(500).json({ error: 'Status ophalen mislukt' });
        }
    });

    // --- Payment Settings ---

    router.get('/payment-settings', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || `adm-set-${Date.now()}`;
        console.log(`[Admin][${traceId}] Fetching payment settings`);

        try {
            const settings = await directusService.getPaymentSettings(DIRECTUS_URL, DIRECTUS_API_TOKEN);
            res.json(settings);
        } catch (error) {
            console.error(`[Admin][${traceId}] Error fetching settings:`, error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    });

    router.post('/payment-settings', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || `adm-set-${Date.now()}`;
        console.log(`[Admin][${traceId}] Updating payment settings`, req.body);

        try {
            const settings = req.body;
            const updated = await directusService.updatePaymentSettings(DIRECTUS_URL, DIRECTUS_API_TOKEN, settings);
            res.json(updated);
        } catch (error) {
            console.error(`[Admin][${traceId}] Error updating settings:`, error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

    return router;
};
