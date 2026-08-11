import { safeConsoleError } from '../utils/logger.js';

export class AuditService {
    private static getDirectusConfig() {
        const url = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
        const token = process.env.DIRECTUS_STATIC_TOKEN || '';
        return { url, token };
    }

    static async logMail(to: string, templateId: string, status: 'SUCCESS' | 'FAILED', error?: string, data?: Record<string, unknown>) {
        const { url, token } = this.getDirectusConfig();

        if (!token || !url) return;

        try {
            const extraPayload: Record<string, unknown> = {};
            if (data && typeof data === 'object') {
                if ('expiryDate' in data) {
                    extraPayload.membership_expiry = data.expiryDate;
                }
                if ('daysLeft' in data) {
                    extraPayload.days_left = data.daysLeft;
                    const days = Number(data.daysLeft);
                    if (days === 30) {
                        extraPayload.milestone = '30 dagen tot verloop';
                    } else if (days === 7) {
                        extraPayload.milestone = '7 dagen tot verloop';
                    } else if (days === 0) {
                        extraPayload.milestone = 'verlopen (0 tot -14 dagen)';
                    }
                }
            }

            await fetch(`${url}/items/system_logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'email',
                    status: status,
                    payload: {
                        emailadres: to,
                        template_id: templateId,
                        error_details: error || `Email ${templateId} successfully dispatched`,
                        timestamp: new Date().toISOString(),
                        environment: process.env.ENV_NAME,
                        ...extraPayload
                    }
                })
            });
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[audit.ts][logMail] ', `Failed to log to Directus: ${typedError.message}`);
        }
    }
}