const express = require('express');
const axios = require('axios');

module.exports = function (DIRECTUS_URL, DIRECTUS_API_TOKEN, directusService) {
    const router = express.Router();

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
