import 'server-only';
import { safeConsoleError } from '@/server/utils/logger';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

export type NdaMailData = Record<string, string | number | boolean | null | undefined | { name: string; email: string }[]>;

export async function sendNdaMail(to: string, templateId: string, data: NdaMailData): Promise<boolean> {
    if (!INTERNAL_SERVICE_TOKEN) {
        safeConsoleError('[nda-mail.utils.ts][sendNdaMail] Missing INTERNAL_SERVICE_TOKEN');
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
            safeConsoleError('[nda-mail.utils.ts][sendNdaMail] ', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        safeConsoleError('[nda-mail.utils.ts][sendNdaMail] ', error);
        return false;
    }
}
