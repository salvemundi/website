import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import type { Committee } from '@/shared/lib/permissions';

export const getFinanceServiceUrl = () =>
    process.env.FINANCE_SERVICE_URL;

export const getMailServiceUrl = () =>
    process.env.MAIL_SERVICE_URL;

export const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
}

export async function checkAdminAccess() {
    const session = await getSession();
    if (!session || !session.user) return null;
    
    const user = session.user;
    // user is typed from Better-Auth but committees is enriched as Committee[] by our session plugin
    const permissions = (user as { committees?: Committee[] }).committees || [];
    const { isSuperAdmin } = await import('@/lib/auth-utils');
    if (!isSuperAdmin(permissions)) return null;
    return session;
}

export async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = 10000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}
