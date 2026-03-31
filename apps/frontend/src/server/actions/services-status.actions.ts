'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { getSystemDirectus } from "@/lib/directus";
import { readMe } from "@directus/sdk";
import { COMMITTEES } from "@/shared/lib/permissions-config";

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkSystemAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    const memberships = user.committees || [];
    
    // Only ICT and Bestuur are allowed to see system status
    const hasAccess = memberships.some((c: any) => 
        c.id === COMMITTEES.ICT || c.id === COMMITTEES.BESTUUR
    );
    
    return hasAccess ? session : null;
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

    const results: ServiceStatus[] = [];

    // 1. Check Directus
    const directusStart = Date.now();
    try {
        await getSystemDirectus().request(readMe());
        results.push({
            name: 'Directus CMS',
            status: 'online',
            latency: Date.now() - directusStart
        });
    } catch (e: any) {
        results.push({
            name: 'Directus CMS',
            status: 'offline',
            error: e.message
        });
    }

    // 2. Check Azure Management Service
    if (AZURE_MGMT_URL) {
        const start = Date.now();
        try {
            const res = await fetch(`${AZURE_MGMT_URL}/api/health`, { 
                headers: INTERNAL_TOKEN ? { 'Authorization': `Bearer ${INTERNAL_TOKEN}` } : {},
                cache: 'no-store' 
            });
            results.push({
                name: 'Azure Management',
                status: res.ok ? 'online' : 'degraded',
                latency: Date.now() - start,
                error: res.ok ? undefined : `HTTP ${res.status}`
            });
        } catch (e: any) {
            results.push({
                name: 'Azure Management',
                status: 'offline',
                error: 'Connection failed'
            });
        }
    }

    // 3. Check Azure Sync Service
    if (AZURE_SYNC_URL) {
        const start = Date.now();
        try {
            // Using /api/sync/status as its health check
            const res = await fetch(`${AZURE_SYNC_URL}/api/sync/status`, { 
                headers: INTERNAL_TOKEN ? { 'Authorization': `Bearer ${INTERNAL_TOKEN}` } : {},
                cache: 'no-store' 
            });
            results.push({
                name: 'Azure Sync Service',
                status: res.ok ? 'online' : 'degraded',
                latency: Date.now() - start,
                error: res.ok ? undefined : `HTTP ${res.status}`
            });
        } catch (e: any) {
            results.push({
                name: 'Azure Sync Service',
                status: 'offline',
                error: 'Connection failed'
            });
        }
    }

    // 4. Check Notification API
    if (NOTIFICATION_API_URL) {
        const start = Date.now();
        try {
            // Standard /health check if exists, otherwise fallback to simple fetch
            const res = await fetch(`${NOTIFICATION_API_URL}/health`, { cache: 'no-store' });
            results.push({
                name: 'Notification API',
                status: res.ok ? 'online' : 'degraded',
                latency: Date.now() - start,
                error: res.ok ? undefined : `HTTP ${res.status}`
            });
        } catch (e: any) {
            results.push({
                name: 'Notification API',
                status: 'offline',
                error: 'Connection failed'
            });
        }
    }

    return results;
}
