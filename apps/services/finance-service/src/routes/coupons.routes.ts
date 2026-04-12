import { FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import { COUPON_FIELDS } from '@salvemundi/validations';

export default async function couponsRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/coupons/validate
     * Validates a coupon code against Directus database via SQL.
     */
    fastify.post('/validate', async (request: any, reply) => {
        // 1. Internal Security Check
        const authHeader = request.headers.authorization;
        const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
        
        if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
            fastify.log.warn('[FINANCE] Unauthorized coupon validation attempt');
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { couponCode } = request.body;

        if (!couponCode) {
            return reply.status(400).send({ error: 'Missing couponCode' });
        }

        try {
            // SQL-First Approach: Query the coupons table directly.
            // Using parameterized query ($1) to prevent SQL Injection (Pentest-safe).
            const query = `
                SELECT 
                    id, 
                    discount_type, 
                    discount_value, 
                    description, 
                    usage_count, 
                    usage_limit, 
                    valid_from, 
                    valid_until, 
                    is_active
                FROM coupons
                WHERE UPPER(coupon_code) = UPPER($1)
                LIMIT 1
            `;

            const { rows } = await fastify.db.query(query, [couponCode.trim()]);
            const coupon = rows[0];

            if (!coupon) {
                return reply.status(404).send({ valid: false, error: 'Coupon niet gevonden' });
            }

            // 2. Manual Toggle Check
            if (!coupon.is_active) {
                return reply.status(400).send({ valid: false, error: 'Deze coupon is momenteel niet actief' });
            }

            // 3. Date Validation Logic
            const now = new Date();
            
            if (coupon.valid_from && new Date(coupon.valid_from) > now) {
                return reply.status(400).send({ valid: false, error: 'Deze coupon is nog niet geldig' });
            }

            if (coupon.valid_until && new Date(coupon.valid_until) < now) {
                return reply.status(400).send({ valid: false, error: 'Deze coupon is verlopen' });
            }

            // 4. Usage Limit Check
            if (coupon.usage_limit !== null && (coupon.usage_count || 0) >= coupon.usage_limit) {
                return reply.status(400).send({ valid: false, error: 'Deze coupon is al maximaal gebruikt' });
            }

            // Success - Return standardized coupon data
            return {
                valid: true,
                discount_value: Number(coupon.discount_value),
                discount_type: coupon.discount_type,
                description: coupon.description || `Korting: ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' EUR'}`
            };
        } catch (err: any) {
            fastify.log.error('[FINANCE] SQL Error validating coupon:', err.message);
            return reply.status(500).send({ error: 'Fout bij raadplegen van de database' });
        }
    });
}
