import { type Redis } from 'ioredis';
import { schema, eq, type db as dbType } from '@salvemundi/db';
import { DirectusRetryService } from './directus-retry.service.js';
import { type FastifyBaseLogger } from 'fastify';

export interface RegistrationUpdateMetadata {
    registrationId: string | number;
    registrationType: string;
    paymentType?: string;
}

const COLLECTION_MAP = new Map<string, string>([
    ['event_signup', 'event_signups'],
    ['pub_crawl_signup', 'pub_crawl_signups'],
    ['trip_signup', 'trip_signups']
]);

export class RegistrationService {
    static async updateStatus(
        db: typeof dbType,
        redis: Redis,
        metadata: RegistrationUpdateMetadata,
        log: FastifyBaseLogger
    ) {
        const { registrationId, registrationType, paymentType } = metadata;

        if (!registrationId || !registrationType) {
            log.warn({ registrationId, registrationType }, '[registration.service.ts][updateStatus] Missing ID or Type for status update');
            return;
        }

        const targetCollection = COLLECTION_MAP.get(registrationType);
        if (!targetCollection) {
            log.warn(`[registration.service.ts][updateStatus] Unknown registration type: ${registrationType}`);
            return;
        }

        let updateData: Record<string, unknown> = { payment_status: 'paid' };

        if (registrationType === 'trip_signup' && paymentType) {
            if (paymentType === 'deposit') {
                updateData = {
                    deposit_paid: true,
                    deposit_paid_at: new Date().toISOString()
                };
            } else if (paymentType === 'final') {
                updateData = {
                    full_payment_paid: true,
                    full_payment_paid_at: new Date().toISOString()
                };
            }
        }

        try {
            let schemaTable;
            switch (targetCollection) {
                case 'event_signups':
                    schemaTable = schema.event_signups;
                    break;
                case 'pub_crawl_signups':
                    schemaTable = schema.pub_crawl_signups;
                    break;
                case 'trip_signups':
                    schemaTable = schema.trip_signups;
                    break;
                default:
                    throw new Error(`Unknown collection: ${targetCollection}`);
            }

            await db.update(schemaTable)
                .set(updateData)
                .where(eq(schemaTable.id, Number(registrationId)));

            log.info(`[registration.service.ts][updateStatus] Direct SQL update success for ${targetCollection} ${registrationId}`);

            await DirectusRetryService.queueUpdate(redis, targetCollection, registrationId, updateData);
            log.info(`[registration.service.ts][updateStatus] Queued Directus update for ${targetCollection} ${registrationId}`);
        } catch (error) {
            log.error(error, `[registration.service.ts][updateStatus] Failed to update registration ${registrationId}`);
            throw error;
        }
    }
}
