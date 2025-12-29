const express = require('express');
const axios = require('axios');

module.exports = function (DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService, membershipService) {
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
     * Fetch all pending dev signups
     */
    router.get('/pending-signups', requireAdmin, async (req, res) => {
        console.log('[AdminRoutes] GET /pending-signups called');
        try {
            console.log('[AdminRoutes] Fetching from Directus:', {
                url: `${DIRECTUS_URL}/items/transactions`,
                usingToken: DIRECTUS_API_TOKEN ? 'Yes (length: ' + DIRECTUS_API_TOKEN.length + ')' : 'No'
            });

            const response = await axios.get(
                `${DIRECTUS_URL}/items/transactions`,
                {
                    params: {
                        'filter[approval_status][_eq]': 'pending',
                        'sort': '-date_created',
                        'limit': 100
                    },
                    headers: { 'Authorization': `Bearer ${DIRECTUS_API_TOKEN}` }
                }
            );

            console.log('[AdminRoutes] Directus response received:', {
                status: response.status,
                dataLength: response.data?.data?.length || 0
            });

            res.json({ signups: response.data.data || [] });
        } catch (error) {
            console.error('[AdminRoutes] Failed to fetch pending signups:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                directusErrorFull: JSON.stringify(error.response?.data, null, 2),
                requestURL: error.config?.url,
                requestParams: error.config?.params,
                hasAuthHeader: !!error.config?.headers?.Authorization,
                authHeaderLength: error.config?.headers?.Authorization?.length
            });
            res.status(500).json({ error: 'Failed to fetch pending signups' });
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

            // Update approval status first
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

            // Extract metadata - stored as JSON string in transaction_id field or separate metadata field
            let metadata = {};
            try {
                // Try parsing from transaction_id field (Mollie webhook stores it there)
                if (transaction.transaction_id && typeof transaction.transaction_id === 'string') {
                    const molliePayment = await axios.get(
                        `https://api.mollie.com/v2/payments/${transaction.transaction_id}`,
                        { headers: { 'Authorization': `Bearer ${process.env.MOLLIE_API_KEY}` } }
                    );
                    metadata = molliePayment.data.metadata || {};
                }
            } catch (error) {
                console.error('[AdminRoutes] Could not fetch Mollie payment metadata:', error.message);
                // Continue with empty metadata
            }

            // Extract user info from transaction or metadata
            const userId = metadata.userId || transaction.user_id;
            const firstName = metadata.firstName || transaction.first_name;
            const lastName = metadata.lastName || transaction.last_name;
            const email = metadata.email || transaction.email;

            // Create account based on user type
            if (userId) {
                // Existing user - just provision membership
                console.log(`[AdminRoutes] Provisioning membership for existing user: ${userId}`);
                await membershipService.provisionMember(MEMBERSHIP_API_URL, userId);
            } else if (firstName && lastName && email) {
                // New user - create Entra ID account
                console.log(`[AdminRoutes] Creating new member account for: ${email}`);
                const credentials = await membershipService.createMember(
                    MEMBERSHIP_API_URL,
                    firstName,
                    lastName,
                    email
                );

                if (credentials) {
                    // Send welcome email with credentials
                    await notificationService.sendWelcomeEmail(
                        EMAIL_SERVICE_URL,
                        email,
                        firstName,
                        credentials
                    );
                    console.log(`[AdminRoutes] Welcome email sent to: ${email}`);
                }
            } else {
                console.warn(`[AdminRoutes] Insufficient data to create account for transaction ${transactionId}`);
                return res.status(400).json({
                    error: 'Insufficient user data',
                    message: 'Cannot create account - missing user information'
                });
            }

            res.json({
                success: true,
                message: 'Signup approved and account created',
                transaction_id: transactionId
            });
        } catch (error) {
            console.error('[AdminRoutes] Approval failed:', error.message);
            res.status(500).json({ error: 'Failed to approve signup', details: error.message });
        }
    });

    /**
     * POST /api/admin/reject-signup/:id
     * Reject a signup (no account created)
     */
    router.post('/reject-signup/:id', requireAdmin, async (req, res) => {
        const transactionId = req.params.id;

        try {
            const transaction = await directusService.getTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionId
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (transaction.approval_status === 'rejected') {
                return res.status(400).json({ error: 'Already rejected' });
            }

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

    return router;
};
