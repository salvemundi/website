import { getDirectusClient } from '../config/directus.js';
import { createItem } from '@directus/sdk';
import { safeConsoleError } from '../utils/logger.js';

export class AuditService {
    static async logSystemAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: Record<string, unknown>) {
        try {
            await getDirectusClient().request(createItem('system_logs', {
                type,
                status,
                payload: {
                    ...payload,
                    admin_name: 'Systeem',
                    timestamp: new Date().toISOString(),
                    environment: process.env.ENV_NAME
                }
            }));
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[audit.service.ts][logSystemAction] ', `Failed to log action: ${typedError.message}`);
        }
    }

    static async logMembershipRenewal(email: string, userId?: string, paymentId?: string, oldExpiry?: string | null, newExpiry?: string | null) {
        await this.logSystemAction('membership_renewal', 'SUCCESS', {
            lid: email,
            email,
            user_id: userId || '',
            payment_id: paymentId || '',
            old_expiry: oldExpiry || 'geen',
            new_expiry: newExpiry || '',
            details: `Lidmaatschap verlengd (van ${oldExpiry || 'geen'} naar ${newExpiry || ''})`
        });
    }

    static async logMembershipProvisioning(email: string, firstName: string, lastName: string, paymentId?: string) {
        await this.logSystemAction('membership_provisioning', 'SUCCESS', {
            naam: `${firstName} ${lastName}`,
            email,
            payment_id: paymentId || '',
            details: 'Account creatie gestart in Azure'
        });
    }
}