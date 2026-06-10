import { type Redis } from 'ioredis';
import { type Kysely } from 'kysely';
import { type Database } from '../plugins/db.js';
import { DirectusRetryService } from './directus-retry.service.js';
import { type FastifyBaseLogger } from 'fastify';

export interface RegistrationUpdateMetadata {
    registrationId: string | number;
    registrationType: string;
    paymentType?: string;
}

const COLLECTION_MAP = new Map<string, keyof Database>([
    ['event_signup', 'event_signups'],
    ['pub_crawl_signup', 'pub_crawl_signups'],
    ['trip_signup', 'trip_signups']
]);

export class RegistrationService {
    static async updateStatus(
        db: Kysely<Database>,
        redis: Redis,
        metadata: RegistrationUpdateMetadata,
        log: FastifyBaseLogger
    ) {
        const { registrationId, registrationType, paymentType } = metadata;

        if (!registrationId || !registrationType) {
            log.warn({ registrationId, registrationType }, '[RegistrationService] Missing ID or Type for status update');
            return;
        }

        const targetCollection = COLLECTION_MAP.get(registrationType);
        if (!targetCollection) {
            log.warn(`[RegistrationService] Unknown registration type: ${registrationType}`);
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
            await db.updateTable(targetCollection)
                .set(updateData as never)
                .where('id' as never, '=', Number(registrationId) as never)
                .execute();

            log.info(`[RegistrationService] Direct SQL update success for ${targetCollection} ${registrationId}`);

            await DirectusRetryService.queueUpdate(redis, targetCollection as string, registrationId, updateData);
            log.info(`[RegistrationService] Queued Directus update for ${targetCollection} ${registrationId}`);
        } catch (error) {
            log.error(error, `[RegistrationService] Failed to update registration ${registrationId}`);
            throw error;
        }
    }
}