import { safeConsoleError } from '../utils/logger.js';

export class AuditService {
    private static getDirectusConfig() {
        const url = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
        const token = process.env.DIRECTUS_STATIC_TOKEN || '';
        return { url, token };
    }

    static async logMail(to: string, templateId: string, status: 'SUCCESS' | 'FAILED', error?: string) {
        const { url, token } = this.getDirectusConfig();

        if (!token || !url) return;

        try {
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
                        timestamp: new Date().toISOString()
                    }
                })
            });
        } catch (error: unknown) {
            safeConsoleError('[AuditService] Failed to log to Directus:', error);
        }
    }
}