import type { Committee } from '@/shared/lib/permissions';

export const getFinanceServiceUrl = () =>
    process.env.FINANCE_SERVICE_URL;

export const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

import { getEnrichedSession } from '@/server/auth/auth-utils';

export async function getSession() {
    return await getEnrichedSession();
}

export async function checkAdminAccess() {
    const session = await getSession();
    if (!session?.user) return null;

    const user = session.user;
    const permissions = (user as { committees?: Committee[] }).committees || [];
    const { isSuperAdmin } = await import('@/lib/auth');
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
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

