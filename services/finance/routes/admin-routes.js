const express = require('express');
const axios = require('axios');

module.exports = function (DIRECTUS_URL, DIRECTUS_API_TOKEN, directusService, membershipService, notificationService, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL) {
    const router = express.Router();

    /**
     * GET /api/admin/pending-signups
     * Fetch transactions that need manual approval or are recently active.
     */
    router.get('/pending-signups', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || `adm-list-${Date.now()}`;
        const filters = {
            status: req.query.status || 'pending',
            type: req.query.type || 'all',
            show_failed: req.query.show_failed === 'true'
        };

        try {
            const signups = await directusService.getPendingSignups(DIRECTUS_URL, DIRECTUS_API_TOKEN, filters);
            res.json({ signups });
        } catch (error) {
            console.error(`[Admin][${traceId}] Error fetching signups:`, error);
            res.status(500).json({ error: 'Failed to fetch signups' });
        }
    });

    /**
     * POST /api/admin/approve-signup/:id
     * Manually approve a pending signup.
     */
    router.post('/approve-signup/:id', async (req, res) => {
        const { id } = req.params;
        const traceId = req.headers['x-trace-id'] || `adm-appr-${id}`;

        try {
            console.log(`[Admin][${traceId}] Approving signup ${id}`);

            // 1. Fetch transaction details
            const transaction = await directusService.getTransaction(DIRECTUS_URL, DIRECTUS_API_TOKEN, id);
            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

            // 2. Update status in Directus
            await directusService.updateDirectusTransaction(DIRECTUS_URL, DIRECTUS_API_TOKEN, id, {
                approval_status: 'approved'
            });

            // 3. Trigger Post-Approval Logic (Provisioning/Notifications)
            // Reusing logic from payments.js webhook
            const isContribution = transaction.is_contribution || transaction.description?.toLowerCase().includes('lidmaatschap');
            const registrationId = transaction.registration_id;
            const registrationType = transaction.registration_type;

            if (isContribution) {
                const userId = transaction.user_id;
                console.log(`[Admin][${traceId}] Triggering provisioning for ${userId || 'Guest'}`);

                if (userId) {
                    await membershipService.provisionMember(MEMBERSHIP_API_URL, userId, traceId);
                } else {
                    // For guest flow, we might need more info from the transaction
                    // (Assuming guest info was stored in the transaction or related registration)
                    console.warn(`[Admin][${traceId}] Guest approval requires manual user creation or previously stored metadata`);
                }
            }

            if (registrationId && registrationType) {
                const collection = registrationType === 'pub_crawl_signup' ? 'pub_crawl_signups' : (registrationType === 'trip_signup' ? 'trip_signups' : 'event_signups');
                await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, collection, registrationId, {
                    payment_status: 'paid'
                });

                // Send confirmation email
                try {
                    const metadata = {
                        registrationId,
                        registrationType,
                        email: transaction.email,
                        firstName: transaction.first_name,
                        lastName: transaction.last_name,
                        amount: transaction.amount,
                        qrToken: transaction.qr_token
                    };
                    await notificationService.sendConfirmationEmail(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        EMAIL_SERVICE_URL,
                        metadata,
                        transaction.description || 'Approved Signup'
                    );
                } catch (emailErr) {
                    console.warn(`[Admin][${traceId}] Failed to send confirmation email:`, emailErr.message);
                }
            }

            res.json({ success: true });
        } catch (error) {
            console.error(`[Admin][${traceId}] Error approving signup:`, error);
            res.status(500).json({ error: 'Failed to approve signup', details: error.message });
        }
    });

    /**
     * POST /api/admin/reject-signup/:id
     */
    router.post('/reject-signup/:id', async (req, res) => {
        const { id } = req.params;
        const traceId = req.headers['x-trace-id'] || `adm-rej-${id}`;

        try {
            await directusService.updateDirectusTransaction(DIRECTUS_URL, DIRECTUS_API_TOKEN, id, {
                approval_status: 'rejected'
            });
            res.json({ success: true });
        } catch (error) {
            console.error(`[Admin][${traceId}] Error rejecting signup:`, error);
            res.status(500).json({ error: 'Failed to reject signup' });
        }
    });

    /**
     * GET /api/admin/payment-settings
     * Fetch payment-related settings from Directus
     */
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

    /**
     * POST /api/admin/payment-settings
     * Update payment-related settings in Directus
     */
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
