'use server';


const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
const SERVICE_SECRET = process.env.SERVICE_SECRET;

/**
 * Save push subscription to the notification service
 */
export async function savePushSubscriptionAction(payload: {
    subscription: any;
    userId?: string;
}) {
    if (!SERVICE_SECRET) {
        console.error('[NotificationAction] SERVICE_SECRET is not set!');
        return { success: false, error: 'Serverconfiguratie fout' };
    }


    // If a userId is provided, we should ideally verify it, 
    // but the notification service might just need to link it.

    try {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVICE_SECRET,
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[NotificationAction] Backend Error (${response.status}):`, errorText);
            return {
                success: false,
                error: `Notificatie service fout: ${response.status}`,
                details: errorText
            };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[NotificationAction] Network error:', error.message);
        return { success: false, error: 'Kon geen verbinding maken met de notificatie service' };
    }
}

/**
 * Remove push subscription from the notification service
 */
export async function removePushSubscriptionAction(payload: {
    endpoint: string;
}) {
    if (!SERVICE_SECRET) {
        return { success: false, error: 'Serverconfiguratie fout' };
    }

    try {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/unsubscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVICE_SECRET,
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!response.ok) {
            return { success: false, error: `Fout bij uitschrijven: ${response.status}` };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Verbinding verbroken' };
    }
}
