'use server';

import { checkAdminAccess } from "@/server/actions/admin/admin-utils.actions";
import { getRedis } from "@/server/auth/redis-client";
import { safeConsoleError } from "@/server/utils/logger";

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const FINANCE_URL = process.env.FINANCE_SERVICE_URL;
const MAIL_URL = process.env.MAIL_SERVICE_URL;
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkSystemAdminAccess() {
    const access = await checkAdminAccess();
    if (!access.isAuthorized || !access.isIct) return null;
    return access;
}

export interface ServiceStatus {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    latency?: number;
    error?: string;
    details?: { [key: string]: unknown };
    lastOffline?: string;
    lastOnline?: string;
    outageStart?: string;
}

interface ServiceHistory {
    lastOffline?: string;
    lastOnline?: string;
    lastError?: string;
    outageStart?: string;
}

async function updateServiceHistory(
    name: string,
    currentStatus: 'online' | 'offline' | 'degraded',
    currentError?: string
): Promise<ServiceHistory> {
    const key = `system:service-status:${name.toLowerCase().replace(/\s+/g, '-')}`;
    const nowIso = new Date().toISOString();

    try {
        const redis = await getRedis();
        const cached = await redis.get(key);
        let history: ServiceHistory = {};
        if (cached) {
            try {
                history = JSON.parse(cached) as ServiceHistory;
            } catch (parseErr) {
                safeConsoleError(`[services-status.actions.ts][updateServiceHistory] Failed to parse cached history for ${name}:`, parseErr);
            }
        }

        const wasOnline = !history.outageStart && (history.lastOnline || !history.lastOffline);

        if (currentStatus === 'online') {
            history.lastOnline = nowIso;
            history.outageStart = undefined;
        } else {
            history.lastOffline = nowIso;
            history.lastError = currentError || 'Connection failed';
            if (wasOnline) {
                history.outageStart = nowIso;
            }
        }

        await redis.set(key, JSON.stringify(history));
        return history;
    } catch (err) {
        safeConsoleError(`[services-status.actions.ts][updateServiceHistory] Redis error for ${name}:`, err);
        return {};
    }
}

export async function getServicesStatusAction(): Promise<ServiceStatus[]> {
    const admin = await checkSystemAdminAccess();
    if (!admin) throw new Error("Unauthorized");

    const timeout = 2000;

    const checkService = async (
        name: string,
        url: string | undefined,
        auth: boolean = false,
        healthPath: string = '/health'
    ): Promise<ServiceStatus | null> => {
        if (!url) return null;
        const start = Date.now();
        let status: 'online' | 'offline' | 'degraded' = 'offline';
        let error: string | undefined = undefined;
        let latency: number | undefined = undefined;

        try {
            const fetchUrl = url.endsWith('/') ? `${url}${healthPath.slice(1)}` : `${url}${healthPath}`;
            const res = await fetch(fetchUrl, {
                headers: auth && INTERNAL_TOKEN ? { 'Authorization': `Bearer ${INTERNAL_TOKEN}` } : {},
                cache: 'no-store',
                signal: AbortSignal.timeout(timeout)
            });

            status = res.ok ? 'online' : 'degraded';
            latency = Date.now() - start;
            error = res.ok ? undefined : `HTTP ${res.status}`;
        } catch (e: unknown) {
            const err = e as Error;
            status = 'offline';
            error = err.name === 'AbortError' ? 'Timeout (2s)' : 'Connection failed';
        }

        const history = await updateServiceHistory(name, status, error);

        return {
            name,
            status,
            latency,
            error: error || history.lastError,
            lastOffline: history.lastOffline,
            lastOnline: history.lastOnline,
            outageStart: history.outageStart
        };
    };

    // 1. Check Directus (Specific SDK call)
    const checkDirectus = async (): Promise<ServiceStatus> => {
        const start = Date.now();
        let status: 'online' | 'offline' | 'degraded' = 'offline';
        let error: string | undefined = undefined;
        let latency: number | undefined = undefined;

        try {
            const directusUrl = process.env.INTERNAL_DIRECTUS_URL || '';
            if (!directusUrl) throw new Error('Directus URL not configured');

            const healthUrl = directusUrl.endsWith('/') ? `${directusUrl}server/health` : `${directusUrl}/server/health`;
            const res = await fetch(healthUrl, {
                cache: 'no-store',
                signal: AbortSignal.timeout(timeout)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            status = 'online';
            latency = Date.now() - start;
        } catch (e: unknown) {
            const err = e as Error;
            status = 'offline';
            error = err.name === 'AbortError' ? 'Timeout (2s)' : err.message;
        }

        const history = await updateServiceHistory('Directus CMS', status, error);

        return {
            name: 'Directus CMS',
            status,
            latency,
            error: error || history.lastError,
            lastOffline: history.lastOffline,
            lastOnline: history.lastOnline,
            outageStart: history.outageStart
        };
    };

    const results = await Promise.all([
        checkDirectus(),
        checkService('Azure Management', AZURE_MGMT_URL, true, '/health'),
        checkService('Azure Sync Service', AZURE_SYNC_URL, true, '/health'),
        checkService('Finance Service', FINANCE_URL, true, '/health'),
        checkService('Mail Service', MAIL_URL, true, '/health'),
        checkService('Notification API', NOTIFICATION_API_URL, false, '/health')
    ]);

    return results.filter(Boolean) as ServiceStatus[];
}
