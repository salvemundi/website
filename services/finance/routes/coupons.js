const express = require('express');

module.exports = function (directusService, DIRECTUS_URL, DIRECTUS_API_TOKEN) {
    const router = express.Router();

    router.post('/validate', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || 'no-trace';
        const { couponCode } = req.body;
        console.warn(`[Coupon][${traceId}] Incoming validation for: "${couponCode}"`);

        try {
            if (!couponCode) {
                console.warn(`[Coupon][${traceId}] REJECT: Missing couponCode`);
                return res.status(400).json({ valid: false, error: 'Geen coupon code opgegeven' });
            }

            console.warn(`[Coupon][${traceId}] Step 1: Querying Directus for coupon...`);
            const coupon = await directusService.getCoupon(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                couponCode,
                traceId
            );

            if (!coupon) {
                console.warn(`[Coupon][${traceId}] REJECT: Coupon "${couponCode}" not found`);
                return res.status(404).json({ valid: false, error: 'Ongeldige coupon code' });
            }

            console.warn(`[Coupon][${traceId}] Found coupon: ID=${coupon.id}, Value=${coupon.discount_value}, Type=${coupon.discount_type}, Active=${coupon.is_active}`);

            // 1. Check if manually active
            const isManuallyActive = String(coupon.is_active) === 'true'; // Handle string or boolean
            if (!isManuallyActive) {
                console.warn(`[Coupon][${traceId}] REJECT: Coupon is manually deactivated`);
                return res.status(400).json({ valid: false, error: 'Deze coupon is gedeactiveerd' });
            }

            // 2. Check validity period
            const now = new Date();
            console.warn(`[Coupon][${traceId}] Checking dates (Now: ${now.toISOString()})`);

            if (coupon.valid_from) {
                const validFrom = new Date(coupon.valid_from);
                if (validFrom > now) {
                    console.warn(`[Coupon][${traceId}] REJECT: Future valid_from`);
                    return res.status(400).json({ valid: false, error: 'Coupon is nog niet geldig' });
                }
            }

            if (coupon.valid_until) {
                const validUntil = new Date(coupon.valid_until);
                if (validUntil < now) {
                    console.warn(`[Coupon][${traceId}] REJECT: Expired valid_until`);
                    return res.status(400).json({ valid: false, error: 'Coupon is verlopen' });
                }
            }

            // 3. Check usage limit
            if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
                console.warn(`[Coupon][${traceId}] REJECT: Usage limit reached`);
                return res.status(400).json({ valid: false, error: 'Coupon limiet bereikt' });
            }

            console.warn(`[Coupon][${traceId}] ACCEPT: Coupon is valid!`);
            // Return discount details
            res.json({
                valid: true,
                code: coupon.coupon_code,
                discount_type: coupon.discount_type,
                discount_value: parseFloat(coupon.discount_value),
                description: coupon.description || 'Korting toegepast'
            });

        } catch (error) {
            console.error(`[Coupon][${traceId}] FATAL: ${error.message}`, error);
            res.status(500).json({ valid: false, error: 'Server fout bij valideren coupon' });
        }
    });

    return router;
};
