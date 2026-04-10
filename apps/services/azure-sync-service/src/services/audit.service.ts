import { getDirectusClient } from '../config/directus.js';
import { createItem } from '@directus/sdk';

export class AuditService {
    static async logSystemAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: any) {
        try {
            await getDirectusClient().request(createItem('system_logs' as any, {
                type,
                status,
                payload: {
                    ...payload,
                    admin_name: 'Systeem',
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (e) {
            console.warn('[AuditService] Failed to log action:', e);
        }
    }

    static async logMembershipRenewal(email: string, userId?: string, paymentId?: string) {
        await this.logSystemAction('membership_ renewal', 'SUCCESS', {
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
