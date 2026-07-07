'use server';

import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';

const FINANCE_URL = process.env.FINANCE_SERVICE_URL;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

interface FinanceErrorResponse {
    error?: string;
    message?: string;
}

export async function sendPaymentEmail(signupId: number, tripId: number, paymentType: 'deposit' | 'final') {
    await requireAdminResource(AdminResource.Reis);

    if (!INTERNAL_SERVICE_TOKEN) {
        throw new Error('Missing service token');
    }

    try {
        const url = new URL(`${FINANCE_URL}/api/finance/trip-payment-request`);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
            },
            body: JSON.stringify({
                signupId,
                tripId,
                paymentType
            })
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => 'Unknown API Error');
            let parsedError = errText;
             try {
                const parsed = JSON.parse(errText) as FinanceErrorResponse;
                parsedError = parsed.error || parsed.message || errText;
            } catch {
            }

            safeConsoleError('[trip-mail.actions.ts][sendPaymentEmail] ', parsedError);
            await logAdminAction('system_mail_error', 'ERROR', {
                context: 'reis',
                signup_id: signupId,
                trip_id: tripId,
                payment_type: paymentType,
                errorMessage: parsedError
            });
            return { success: false, error: parsedError };
        }

        return { success: true };
    } catch (error) {
        safeConsoleError('[trip-mail.actions.ts][sendPaymentEmail] ', error);
        await logAdminAction('system_mail_error', 'ERROR', {
            context: 'reis',
            signup_id: signupId,
            trip_id: tripId,
            payment_type: paymentType,
            errorMessage: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: error instanceof Error ? error.message : 'Onbekende fout' };
    }
}

export async function sendBulkTripEmail(data: {
    tripId: number;
    recipients: { email: string; name: string }[];
    subject: string;
    message: string;
}) {
    await requireAdminResource(AdminResource.Reis);

    if (!INTERNAL_SERVICE_TOKEN) {
        throw new Error('Missing service token');
    }

    const mailUrl = process.env.MAIL_SERVICE_URL;

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
                template: 'trip-announcement',
                data: {
                    message: data.message,
                    tripId: data.tripId
                }
            })
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as unknown;
            safeConsoleError('[trip-mail.actions.ts][sendBulkTripEmail] ', errorData);
            await logAdminAction('system_mail_error', 'ERROR', {
                context: 'reis',
                trip_id: data.tripId,
                recipient_count: data.recipients.length,
                errorMessage: JSON.stringify(errorData)
            });
            return { success: false, error: 'Bulk e-mail verzenden mislukt' };
        }

        return { success: true };
    } catch (error) {
        safeConsoleError('[trip-mail.actions.ts][sendBulkTripEmail] ', error);
        await logAdminAction('system_mail_error', 'ERROR', {
            context: 'reis',
            trip_id: data.tripId,
            recipient_count: data.recipients.length,
            errorMessage: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: error instanceof Error ? error.message : 'Verzenden mislukt' };
    }
}

export async function sendBulkPaymentEmails(tripId: number, signupIds: number[], paymentType: 'deposit' | 'final') {
    await requireAdminResource(AdminResource.Reis);

    const results = {
        successCount: 0,
        failCount: 0
    };
    const errors: string[] = [];

    for (const signupId of signupIds) {
        try {
            const res = await sendPaymentEmail(signupId, tripId, paymentType);
            if (res.success) {
                results.successCount++;
            } else {
                results.failCount++;
                errors.push(`Deelnemer #${signupId}: ${res.error || 'Onbekende fout'}`);
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            safeConsoleError('[trip-mail.actions.ts][sendBulkPaymentEmails] ', error);
            await logAdminAction('system_mail_error', 'ERROR', {
                context: 'reis',
                trip_id: tripId,
                signup_id: signupId,
                payment_type: paymentType,
                errorMessage: errMsg
            });
            results.failCount++;
            errors.push(`Deelnemer #${signupId}: ${errMsg}`);
        }
    }

    return {
        success: results.failCount === 0,
        errors,
        ...results
    };
}