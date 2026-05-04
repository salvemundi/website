import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { DirectusRetryService } from './directus-retry.service.js';

export interface RegistrationUpdateMetadata {
    registrationId: string | number;
    registrationType: string;
    paymentType?: string; // 'deposit' | 'final' for trips
}

export class RegistrationService {
    /**
     * Updates the registration status in both Directus (via retry queue)
     * and the PostgreSQL database directly for immediate consistency.
     */
    static async updateStatus(
        db: Pool,
        redis: Redis,
        metadata: RegistrationUpdateMetadata,
        log: any
    ) {
        const { registrationId, registrationType, paymentType } = metadata;

        if (!registrationId || !registrationType) {
            log.warn('[RegistrationService] Missing ID or Type for status update', { registrationId, registrationType });
            return;
        }

        const collectionMap: Record<string, string> = {
            'event_signup': 'event_signups',
            'pub_crawl_signup': 'pub_crawl_signups',
            'trip_signup': 'trip_signups'
        };

        const targetCollection = collectionMap[registrationType];
        if (!targetCollection) {
            log.warn(`[RegistrationService] Unknown registration type: ${registrationType}`);
            return;
        }

        let updateData: any = { payment_status: 'paid' };
        let sqlQuery = '';
        let sqlParams: any[] = [];

        if (registrationType === 'trip_signup' && paymentType) {
            if (paymentType === 'deposit') {
                updateData = { 
                    deposit_paid: true, 
                    deposit_paid_at: new Date().toISOString() 
                };
                sqlQuery = 'UPDATE trip_signups SET deposit_paid = true, deposit_paid_at = NOW() WHERE id = $1';
                sqlParams = [registrationId];
            } else if (paymentType === 'final') {
                updateData = { 
                    full_payment_paid: true, 
                    full_payment_paid_at: new Date().toISOString() 
                };
                sqlQuery = 'UPDATE trip_signups SET full_payment_paid = true, full_payment_paid_at = NOW() WHERE id = $1';
                sqlParams = [registrationId];
            }
        } else {
            // Default: update payment_status
            sqlQuery = `UPDATE ${targetCollection} SET payment_status = 'paid' WHERE id = $1`;
            sqlParams = [registrationId];
        }

        try {
            // 1. Direct SQL Update for immediate consistency in V7 Frontend
            if (sqlQuery) {
                await db.query(sqlQuery, sqlParams);
                log.info(`[RegistrationService] Direct SQL update success for ${targetCollection} ${registrationId}`);
            }

            // 2. Queue Directus Update for shadow-write and retry-safety
            await DirectusRetryService.queueUpdate(redis, targetCollection, registrationId, updateData);
            log.info(`[RegistrationService] Queued Directus update for ${targetCollection} ${registrationId}`);
        } catch (err) {
            log.error(err, `[RegistrationService] Failed to update registration ${registrationId}`);
            throw err;
        }
    }
}
