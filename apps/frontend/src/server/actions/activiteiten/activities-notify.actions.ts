'use server';

import { ensureActivitiesEdit } from "./auth-check";

/**
 * NOTIFICATION ACTIONS: Reminders and custom notifications.
 * Gated by: ActivitiesEdit (Leaders, Bestuur, ICT)
 */

const getNotificationUrl = (type: 'reminder' | 'custom') => {
    const baseUrl = process.env.INTERNAL_NOTIFICATION_API_URL || process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
    if (!baseUrl) return null;
    
    const url = new URL(baseUrl);
    url.pathname = url.pathname.replace(/\/send-email$/, type === 'reminder' ? '/send-reminder' : '/send-custom');
    return url.toString();
};

export async function sendActivityReminder(eventId: number) {
    await ensureActivitiesEdit();

    try {
        const url = getNotificationUrl('reminder');
        if (!url) throw new Error("Notification API URL not configured");

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        });

        if (!response.ok) throw new Error("Failed to send reminder");
        const result = await response.json();
        
        return { success: true, sent: result.sent || 0 };
    } catch (error) {
        return { success: false, error: "Failed to send reminder" };
    }
}

export async function sendActivityCustomNotification(eventId: number, title: string, body: string) {
    await ensureActivitiesEdit();

    try {
        const url = getNotificationUrl('custom');
        if (!url) throw new Error("Notification API URL not configured");

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                body,
                data: {
                    url: `/activiteit/${eventId}`,
                    eventId: eventId
                },
                tag: `custom-${eventId}`
            })
        });

        if (!response.ok) throw new Error("Failed to send custom notification");
        const result = await response.json();
        
        return { success: true, sent: result.sent || 0 };
    } catch (error) {
        return { success: false, error: "Failed to send notification" };
    }
}
