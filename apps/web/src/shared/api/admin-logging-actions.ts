'use server';

import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { getUserCommitteesAction } from '@/shared/api/data-actions';
import { createServiceToken } from '@/shared/lib/service-auth';
import { COMMITTEE_TOKENS } from '@/shared/config/committee-tokens';

import { cookies } from 'next/headers';
import { AUTH_COOKIES } from '@/shared/config/auth-config';

const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL;
const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!FINANCE_SERVICE_URL) {
    throw new Error('Server configuration error: FINANCE_SERVICE_URL is not defined in environment variables.');
}
if (!SERVICE_SECRET) {
    throw new Error('Server configuration error: SERVICE_SECRET is not defined in environment variables.');
}

/**
 * Verify if the user has access to logging based on their committee memberships.
 */
async function verifyLoggingAccess() {
    const user = await getCurrentUserAction();
    if (!user) {
        console.warn('[verifyLoggingAccess] No user found in session');
        return { isAuthorized: false, user: null, token: null };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIES.SESSION)?.value || null;

    // Fetch committee memberships with tokens
    const memberships = await getUserCommitteesAction(user.id);

    if (memberships.length === 0) {
        console.warn(`[verifyLoggingAccess] No committees found for user ${user.id}`);
    }

    // Check for required commissie_tokens
    const allowedTokens = [
        COMMITTEE_TOKENS.ICT,
        COMMITTEE_TOKENS.BESTUUR,
        COMMITTEE_TOKENS.KANDI
    ];
    const matchingMembership = memberships.find(m =>
        m.committee_id?.commissie_token && allowedTokens.includes(m.committee_id.commissie_token)
    );

    const hasAccess = !!matchingMembership;

    if (!hasAccess) {
        console.warn(`[verifyLoggingAccess] User ${user.id} (${user.email}) not authorized. Tokens found:`,
            memberships.map(m => m.committee_id?.commissie_token).filter(Boolean)
        );
    }

    return { isAuthorized: hasAccess, user, token };
}

export async function getPendingSignupsAction(params: { status: string; type: string; show_failed: boolean }) {
    const { isAuthorized, token } = await verifyLoggingAccess();
    if (!isAuthorized) throw new Error('Unauthorized');

    if (!SERVICE_SECRET) throw new Error('Server configuration error: SERVICE_SECRET missing');

    const queryParams = new URLSearchParams({
        status: params.status,
        type: params.type,
        show_failed: params.show_failed.toString()
    });

    try {
        const serviceToken = createServiceToken({ iss: 'frontend' }, '5m');

        const response = await fetch(`${FINANCE_SERVICE_URL}/api/admin/pending-signups?${queryParams.toString()}`, {
            headers: {
                'X-API-Key': SERVICE_SECRET,
                'Authorization': `Bearer ${serviceToken}`,
                ...(token ? { 'X-User-Token': token } : {}),
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No body');
            console.error(`[admin-logging-actions] getPendingSignupsAction failed with status ${response.status}:`, errBody);

            try {
                const errJson = JSON.parse(errBody);
                throw new Error(errJson.message || errJson.error || `Failed to fetch signups (${response.status})`);
            } catch {
                throw new Error(`Failed to fetch signups (${response.status})`);
            }
        }

        return await response.json();
    } catch (error: any) {
        console.error('[admin-logging-actions] getPendingSignupsAction error:', error);
        throw error;
    }
}

export async function getPaymentSettingsAction() {
    const { isAuthorized, token } = await verifyLoggingAccess();
    if (!isAuthorized) throw new Error('Unauthorized');

    if (!SERVICE_SECRET) throw new Error('Server configuration error: SERVICE_SECRET missing');

    try {
        const serviceToken = createServiceToken({ iss: 'frontend' }, '5m');

        const response = await fetch(`${FINANCE_SERVICE_URL}/api/admin/payment-settings`, {
            headers: {
                'X-API-Key': SERVICE_SECRET,
                'Authorization': `Bearer ${serviceToken}`,
                ...(token ? { 'X-User-Token': token } : {}),
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No body');
            console.error(`[admin-logging-actions] getPaymentSettingsAction failed with status ${response.status}:`, errBody);
            throw new Error(`Failed to load settings (${response.status})`);
        }
        return await response.json();
    } catch (error) {
        console.error('[admin-logging-actions] getPaymentSettingsAction error:', error);
        throw error;
    }
}

export async function updatePaymentSettingsAction(data: { manual_approval: boolean }) {
    const { isAuthorized, token } = await verifyLoggingAccess();
    if (!isAuthorized) throw new Error('Unauthorized');

    if (!SERVICE_SECRET) throw new Error('Server configuration error: SERVICE_SECRET missing');

    try {
        const serviceToken = createServiceToken({ iss: 'frontend' }, '5m');

        const response = await fetch(`${FINANCE_SERVICE_URL}/api/admin/payment-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVICE_SECRET,
                'Authorization': `Bearer ${serviceToken}`,
                ...(token ? { 'X-User-Token': token } : {}),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update settings');
        return { success: true };
    } catch (error) {
        console.error('[admin-logging-actions] updatePaymentSettingsAction error:', error);
        throw error;
    }
}

export async function approveSignupAction(signupId: string) {
    const { isAuthorized, token } = await verifyLoggingAccess();
    if (!isAuthorized) throw new Error('Unauthorized');

    if (!SERVICE_SECRET) throw new Error('Server configuration error: SERVICE_SECRET missing');

    try {
        const serviceToken = createServiceToken({ iss: 'frontend' }, '5m');

        const response = await fetch(`${FINANCE_SERVICE_URL}/api/admin/approve-signup/${signupId}`, {
            method: 'POST',
            headers: {
                'X-API-Key': SERVICE_SECRET,
                'Authorization': `Bearer ${serviceToken}`,
                ...(token ? { 'X-User-Token': token } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.details || error.error || error.message || 'Failed to approve');
        }
        return { success: true };
    } catch (error) {
        console.error('[admin-logging-actions] approveSignupAction error:', error);
        throw error;
    }
}

export async function rejectSignupAction(signupId: string) {
    const { isAuthorized, token } = await verifyLoggingAccess();
    if (!isAuthorized) throw new Error('Unauthorized');

    if (!SERVICE_SECRET) throw new Error('Server configuration error: SERVICE_SECRET missing');

    try {
        const serviceToken = createServiceToken({ iss: 'frontend' }, '5m');

        const response = await fetch(`${FINANCE_SERVICE_URL}/api/admin/reject-signup/${signupId}`, {
            method: 'POST',
            headers: {
                'X-API-Key': SERVICE_SECRET,
                'Authorization': `Bearer ${serviceToken}`,
                ...(token ? { 'X-User-Token': token } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Failed to reject');
        }
        return { success: true };
    } catch (error) {
        console.error('[admin-logging-actions] rejectSignupAction error:', error);
        throw error;
    }
}
