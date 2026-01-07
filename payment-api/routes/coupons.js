const express = require('express');

module.exports = function (directusService, DIRECTUS_URL, DIRECTUS_API_TOKEN) {
    const router = express.Router();

    router.post('/validate', async (req, res) => {
        try {
            const { couponCode } = req.body;

            if (!couponCode) {
                return res.status(400).json({ valid: false, error: 'Geen coupon code opgegeven' });
            }

            const coupon = await directusService.getCoupon(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                couponCode
            );

            if (!coupon) {
                return res.status(404).json({ valid: false, error: 'Ongeldige coupon code' });
            }

            // Check validity period
            const now = new Date();
            if (coupon.valid_from && new Date(coupon.valid_from) > now) {
                return res.status(400).json({ valid: false, error: 'Coupon is nog niet geldig' });
            }
            if (coupon.valid_until && new Date(coupon.valid_until) < now) {
                return res.status(400).json({ valid: false, error: 'Coupon is verlopen' });
            }

            // Check usage limit
            if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
                return res.status(400).json({ valid: false, error: 'Coupon limiet bereikt' });
            }

            // Return discount details
            res.json({
                valid: true,
                code: coupon.coupon_code,
                discount_type: coupon.discount_type,
                discount_value: parseFloat(coupon.discount_value),
                description: coupon.description || 'Korting toegepast'
            });

        } catch (error) {
            console.error('Coupon Validation Error:', error.message);
            res.status(500).json({ valid: false, error: 'Server fout bij valideren coupon' });
        }
    });

    return router;
};
