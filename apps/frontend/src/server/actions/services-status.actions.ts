'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { getSystemDirectus } from "@/lib/directus";
import { readMe } from "@directus/sdk";
import { checkAdminAccess } from "./admin.actions";

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkSystemAdminAccess() {
    const access = await checkAdminAccess();
    if (!access || !access.isAuthorized || !access.isIct) return null;
    return access;
}

export interface ServiceStatus {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    latency?: number;
    error?: string;
    details?: any;
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
        try {
            const fetchUrl = url.endsWith('/') ? `${url}${healthPath.slice(1)}` : `${url}${healthPath}`;
            const res = await fetch(fetchUrl, {
                headers: auth && INTERNAL_TOKEN ? { 'Authorization': `Bearer ${INTERNAL_TOKEN}` } : {},
                cache: 'no-store',
                signal: AbortSignal.timeout(timeout)
            });
            
            return {
                name,
                status: res.ok ? 'online' : 'degraded',
                latency: Date.now() - start,
                error: res.ok ? undefined : `HTTP ${res.status}`
            };
        } catch (e: any) {
            return {
                name,
                status: 'offline',
                error: e.name === 'AbortError' ? 'Timeout (2s)' : 'Connection failed'
            };
        }
    };

    // 1. Check Directus (Specific SDK call)
    const checkDirectus = async (): Promise<ServiceStatus> => {
        const start = Date.now();
        try {
            // SDK doesn't support AbortSignal.timeout directly in this version easily, 
            // but we can wrap it or use a raw fetch to its health endpoint.
            // Directus has /health or we can just stick to readMe() with a fetch wrap.
            const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';
            const res = await fetch(`${directusUrl}/health`, { 
                cache: 'no-store',
                signal: AbortSignal.timeout(timeout)
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            return {
                name: 'Directus CMS',
                status: 'online',
                latency: Date.now() - start
            };
        } catch (e: any) {
            return {
                name: 'Directus CMS',
                status: 'offline',
                error: e.name === 'AbortError' ? 'Timeout (2s)' : e.message
            };
        }
    };

    const results = await Promise.all([
        checkDirectus(),
        checkService('Azure Management', AZURE_MGMT_URL, true, '/health'),
        checkService('Azure Sync Service', AZURE_SYNC_URL, true, '/health'),
        checkService('Notification API', NOTIFICATION_API_URL, false, '/health')
    ]);

    return results.filter(Boolean) as ServiceStatus[];
}
