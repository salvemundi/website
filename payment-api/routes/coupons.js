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
                console.warn(`[Coupon][${traceId}] REJECT: Coupon not found or inactive in Directus`);
                return res.status(404).json({ valid: false, error: 'Ongeldige coupon code' });
            }

            console.warn(`[Coupon][${traceId}] Found coupon: ID=${coupon.id}, Value=${coupon.discount_value}, Type=${coupon.discount_type}`);

            // Check validity period
            const now = new Date();
            console.warn(`[Coupon][${traceId}] Step 2: Checking dates (Now: ${now.toISOString()})`);

            if (coupon.valid_from) {
                const validFrom = new Date(coupon.valid_from);
                console.warn(`[Coupon][${traceId}] Valid from: ${validFrom.toISOString()}`);
                if (validFrom > now) {
                    console.warn(`[Coupon][${traceId}] REJECT: Future valid_from`);
                    return res.status(400).json({ valid: false, error: 'Coupon is nog niet geldig' });
                }
            }

            if (coupon.valid_until) {
                const validUntil = new Date(coupon.valid_until);
                console.warn(`[Coupon][${traceId}] Valid until: ${validUntil.toISOString()}`);
                if (validUntil < now) {
                    console.warn(`[Coupon][${traceId}] REJECT: Expired valid_until`);
                    return res.status(400).json({ valid: false, error: 'Coupon is verlopen' });
                }
            }

            // Check usage limit
            console.warn(`[Coupon][${traceId}] Step 3: Checking limits (Count: ${coupon.usage_count}, Limit: ${coupon.usage_limit ?? 'none'})`);
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
