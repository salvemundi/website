'use server';

import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { verifyUserPermissions } from './secure-check';

export async function sendMembershipReminderAction(daysBeforeExpiry: number) {
    // 1. Authenticate & Authorize
    let userContext;
    try {
        userContext = await verifyUserPermissions({});
    } catch (e) {
        throw new Error('Unauthorized');
    }

    const { committees, role } = userContext;

    // Only Admin or Board/ICT/Secretary should be able to do this
    // We can tighten this check.
    const isAuthorized =
        (role && role.toLowerCase() === 'administrator') ||
        committees.some(c => ['bestuur', 'ict', 'secretaris'].includes(c.token));

    if (!isAuthorized) {
        throw new Error('Unauthorized: Insufficient permissions');
    }

    // 2. Call Directus (or handle logic)
    // Since we don't know the exact backend implementation for 'send-membership-reminder',
    // we assume there's a custom endpoint or flow we should trigger.
    // For now, let's assume it's a custom endpoint in Directus.
    // If it was a Next.js API route that didn't exist, we must implement the logic here or call Directus.

    try {
        // Option A: Trigger a Directus Flow via a webhook or custom endpoint
        // Option B: Implement the logic here (fetch users, send emails via Directus /mail endpoint)

        // Let's implement Option B-lite: Fetch relevant users and "send notification"
        // But sending emails from here might be heavy.

        // Most likely, this WAS intended to hit a custom Directus endpoint.
        // Let's try to call that endpoint securely server-side.
        // Assuming the endpoint is /notifications/send-membership-reminder (custom extension?)

        // For safety, let's just implement a Logic Placeholder that throws "Not Implemented" unless we are sure.
        // But the user expects it to work.
        // Let's look at what the client code expected: POST /api/notifications/send-membership-reminder
        // Since that route didn't exist in Next.js, it might be hitting Directus via proxy.
        // But proxy didn't allow 'notifications'.

        // I will implement a basic logic here:
        // 1. Fetch users expiring soon.
        // 2. Send them a notification (Directus In-App Notification).

        // Fetch users expiring in X days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);
        const isoDate = targetDate.toISOString().split('T')[0];

        const users = await serverDirectusFetch<any[]>(`/users?filter[membership_expiry][_lte]=${isoDate}&filter[membership_expiry][_gte]=${new Date().toISOString().split('T')[0]}&fields=id,email,first_name`);

        if (!users || users.length === 0) {
            return { sent: 0, message: 'No users found' };
        }

        // Send notifications (Batch)
        // We can use /notifications endpoint of Directus
        const notifications = users.map(u => ({
            recipient: u.id,
            subject: 'Lidmaatschap verloopt binnenkort',
            message: `Hoi ${u.first_name}, je lidmaatschap verloopt op ${isoDate}. Vergeet niet te verlengen!`,
            collection: 'users',
            item: u.id
        }));

        await serverDirectusFetch('/notifications', {
            method: 'POST',
            body: JSON.stringify(notifications)
        });

        return { sent: users.length };

    } catch (error) {
        console.error('Failed to send reminders:', error);
        throw new Error('Failed to send reminders');
    }
}
