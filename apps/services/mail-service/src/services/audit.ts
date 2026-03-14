const DIRECTUS_URL = process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

export class AuditService {
    static async logMail(to: string, templateId: string, status: 'SUCCESS' | 'FAILED', error?: string) {
        if (!STATIC_TOKEN) return;

        try {
            await fetch(`${DIRECTUS_URL}/items/system_logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${STATIC_TOKEN}`
                },
                body: JSON.stringify({
                    type: 'email',
                    recipient: to,
                    template: templateId,
                    status: status,
                    details: error || `Email ${templateId} successfully dispatched`,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (err) {
            console.error('[AuditService] Failed to log to Directus:', err);
        }
    }
}
