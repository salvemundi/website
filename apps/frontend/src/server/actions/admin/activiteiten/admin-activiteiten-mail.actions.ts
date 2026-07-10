'use server';

import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { verifyActivityBOLA } from '@/server/actions/events/activiteiten/activiteiten-write.actions';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function resolveOrganizerEmail(eventId: number): Promise<string> {
    try {
        const eventRecord = await db.query.events.findFirst({
            where: eq(schema.events.id, eventId),
            with: { committee: true }
        });

        if (eventRecord?.contact && eventRecord.contact.includes('@')) {
            return eventRecord.contact;
        }
        if (eventRecord?.committee?.name) {
            const { buildCommitteeEmail } = await import('@/shared/lib/activity-utils');
            const cEmail = buildCommitteeEmail(eventRecord.committee.name);
            if (cEmail) return cEmail;
        }
    } catch {
        // fall through to default
    }
    return 'info@salvemundi.nl';
}

export async function sendBulkEventEmail(data: {
    eventId: number;
    eventName: string;
    recipients: { email: string; name: string }[];
    subject: string;
    message: string;
}) {
    try {
        await verifyActivityBOLA(data.eventId);
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Geen toegang' };
    }

    if (!INTERNAL_SERVICE_TOKEN) {
        throw new Error('Missing service token');
    }

    if (data.recipients.length === 0) {
        return { success: false, error: 'Geen ontvangers geselecteerd' };
    }

    const mailUrl = process.env.MAIL_SERVICE_URL;
    const organizerEmail = await resolveOrganizerEmail(data.eventId);

    try {
        const response = await fetch(`${mailUrl}/api/mail/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
            },
            body: JSON.stringify({
                to: data.recipients,
                subject: data.subject,
                template: 'event-announcement',
                data: {
                    message: data.message,
                    eventName: data.eventName,
                    eventId: data.eventId,
                    organizerEmail
                }
            })
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as unknown;
            safeConsoleError('[admin-activiteiten-mail.actions.ts][sendBulkEventEmail] ', errorData);
            await logAdminAction('system_mail_error', 'ERROR', {
                context: 'activiteit',
                event_id: data.eventId,
                recipient_count: data.recipients.length,
                errorMessage: JSON.stringify(errorData)
            });
            return { success: false, error: 'Bulk e-mail verzenden mislukt' };
        }

        await logAdminAction('admin_event_bulk_mail_sent', 'SUCCESS', {
            context: 'activiteit',
            event_id: data.eventId,
            context_name: data.eventName,
            recipient_count: data.recipients.length
        });

        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-activiteiten-mail.actions.ts][sendBulkEventEmail] ', error);
        await logAdminAction('system_mail_error', 'ERROR', {
            context: 'activiteit',
            event_id: data.eventId,
            recipient_count: data.recipients.length,
            errorMessage: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: error instanceof Error ? error.message : 'Verzenden mislukt' };
    }
}
