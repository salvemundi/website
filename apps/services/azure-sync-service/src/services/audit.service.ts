import { getDirectusClient } from '../config/directus.js';
import { createItem } from '@directus/sdk';

export class AuditService {
    static async logSystemAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: any) {
        try {
            await getDirectusClient().request(createItem('system_logs', {
                type,
                status,
                payload: {
                    ...payload,
                    admin_name: 'Systeem',
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (_error) {
            console.warn('[AuditService] Failed to log action:', error);
        }
    }

    static async logMembershipRenewal(email: string, userId?: string, paymentId?: string) {
        await this.logSystemAction('membership_renewal', 'SUCCESS', {
            lid: email,
            email: email,
            user_id: userId,
            payment_id: paymentId,
            details: 'Lidmaatschap verlengd'
        });
    }

    static async logMembershipProvisioning(email: string, firstName: string, lastName: string, paymentId?: string) {
        await this.logSystemAction('membership_provisioning', 'SUCCESS', {
            naam: `${firstName} ${lastName}`,
            email: email,
            payment_id: paymentId,
            details: 'Account creatie gestart in Azure'
        });
    }
}
