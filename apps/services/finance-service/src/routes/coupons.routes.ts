import { FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import { COUPON_FIELDS } from '@salvemundi/validations';

export default async function couponsRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/coupons/validate
     * Validates a coupon code against Directus database.
     */
    fastify.post('/validate', async (request: any, reply) => {
        const { couponCode } = request.body;

        if (!couponCode) {
            return reply.status(400).send({ error: 'Missing couponCode' });
        }

        try {
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
            
            const directus = createDirectus(directusUrl)
                .with(staticToken(directusToken))
                .with(rest());

            const items = await directus.request(readItems('coupons', {
                filter: {
                    coupon_code: { _eq: couponCode.trim().toUpperCase() },
                    is_active: { _eq: true }
                },
                limit: 1,
                fields: [...COUPON_FIELDS]
            }));

            const coupon = items?.[0] as any;

            if (!coupon) {
                return reply.status(404).send({ valid: false, error: 'Coupon niet gevonden of inactief' });
            }

            // Validation Logic
            const now = new Date();
            
            // Check usage limit
            if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                return reply.status(400).send({ valid: false, error: 'Coupon gebruikslimiet bereikt' });
            }

            // Check valid dates
            if (coupon.valid_from && new Date(coupon.valid_from) > now) {
                return reply.status(400).send({ valid: false, error: 'Coupon is nog niet geldig' });
            }

            if (coupon.valid_until && new Date(coupon.valid_until) < now) {
                return reply.status(400).send({ valid: false, error: 'Coupon is verlopen' });
            }

            return {
                valid: true,
                discount_value: Number(coupon.discount_value),
                discount_type: coupon.discount_type,
                description: coupon.description || `Korting: ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' EUR'}`
            };
        } catch (err: any) {
            fastify.log.error('[FINANCE] Error validating coupon:', err);
            return reply.status(500).send({ error: 'Fout bij coupon validatie' });
        }
    });
}
