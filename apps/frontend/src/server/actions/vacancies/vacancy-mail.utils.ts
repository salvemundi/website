import 'server-only';
import { safeConsoleError } from '@/server/utils/logger';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

export type VacancyMailData = Record<string, string | number | boolean | null | undefined>;

export async function sendVacancyMail(to: string, templateId: string, data: VacancyMailData): Promise<boolean> {
    if (!INTERNAL_SERVICE_TOKEN) {
        safeConsoleError('[vacancy-mail.utils.ts][sendVacancyMail] Missing INTERNAL_SERVICE_TOKEN');
        return false;
    }

    try {
        const response = await fetch(`${process.env.MAIL_SERVICE_URL}/api/mail/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
            },
            body: JSON.stringify({ to, templateId, data })
        });

        if (!response.ok) {
            safeConsoleError('[vacancy-mail.utils.ts][sendVacancyMail] ', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        safeConsoleError('[vacancy-mail.utils.ts][sendVacancyMail] ', error);
        return false;
    }
}

export async function sendVacancyBulkMail(
    recipients: { email: string; name: string }[],
    subject: string,
    template: string,
    data: VacancyMailData
): Promise<boolean> {
    if (!INTERNAL_SERVICE_TOKEN || recipients.length === 0) {
        return false;
    }

    try {
        const response = await fetch(`${process.env.MAIL_SERVICE_URL}/api/mail/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
            },
            body: JSON.stringify({ to: recipients, subject, template, data })
        });

        if (!response.ok) {
            safeConsoleError('[vacancy-mail.utils.ts][sendVacancyBulkMail] ', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        safeConsoleError('[vacancy-mail.utils.ts][sendVacancyBulkMail] ', error);
        return false;
    }
}
