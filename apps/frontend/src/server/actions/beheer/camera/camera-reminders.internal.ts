import 'server-only';

import { db, schema } from '@salvemundi/db';
import { and, eq, isNull, lte, or } from 'drizzle-orm';
import { formatMailDate, getUserMailInfo, sendCameraMail } from '@/server/utils/camera-mail';

const REMINDER_INTERVAL_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (date: string, days: number) =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/**
 * Herinnering naar leners die de camera op of na de afgesproken einddatum nog niet hebben teruggebracht.
 * Op de einddatum zelf en daarna elke REMINDER_INTERVAL_DAYS dagen (last_reminder_on voorkomt dubbele mails).
 */
export async function runCameraReturnRemindersInternal(): Promise<{ sent: number; checked: number }> {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
    const remindBefore = addDays(today, -REMINDER_INTERVAL_DAYS);

    const rows = await db
        .select({ loan: schema.camera_loans, request: schema.camera_requests })
        .from(schema.camera_loans)
        .innerJoin(schema.camera_requests, eq(schema.camera_loans.request_id, schema.camera_requests.id))
        .where(
            and(
                isNull(schema.camera_loans.returned_on),
                lte(schema.camera_requests.end_date, today),
                or(isNull(schema.camera_loans.last_reminder_on), lte(schema.camera_loans.last_reminder_on, remindBefore)),
            ),
        );

    let sent = 0;
    for (const { loan, request } of rows) {
        const borrower = await getUserMailInfo(request.requester_id);
        if (!borrower?.email) continue;

        const daysLate = Math.max(
            0,
            Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${request.end_date}T00:00:00Z`)) / DAY_MS),
        );
        const ok = await sendCameraMail(borrower.email, 'camera-return-reminder', {
            name: borrower.name,
            eventName: request.event_name,
            agreedEnd: formatMailDate(request.end_date),
            late: daysLate > 0,
            daysLate,
            daysLateLabel: daysLate === 1 ? 'dag' : 'dagen',
        });
        if (!ok) continue;

        await db
            .update(schema.camera_loans)
            .set({ last_reminder_on: today })
            .where(eq(schema.camera_loans.id, loan.id));
        sent++;
    }

    return { sent, checked: rows.length };
}

