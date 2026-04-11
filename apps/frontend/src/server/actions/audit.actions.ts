'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { 
    readItems, 
    updateItem,
    readSingleton,
    updateSingleton,
    createItem
} from "@directus/sdk";
import { 
    PendingSignup, 
    EVENT_SIGNUP_FIELDS,
    TRIP_SIGNUP_FIELDS,
    PUB_CRAWL_SIGNUP_FIELDS,
    SYSTEM_LOG_FIELDS
} from "@salvemundi/validations";
import { isSuperAdmin } from "@/lib/auth-utils";
import { query } from '@/lib/db';

export async function logAdminAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: any) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const user = session?.user as any;
        
        await getSystemDirectus().request(createItem('system_logs' as any, {
            type,
            status,
            payload: {
                ...payload,
                admin_id: user?.id || null,
                admin_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Systeem',
                timestamp: new Date().toISOString()
            }
        }));
    } catch (e) {
        console.warn('[Audit] Failed to log action:', e);
    }
}

async function checkAuditAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    const isAdmin = isSuperAdmin(user.committees);

    if (!isAdmin) return null;
    return session;
}

export async function getPendingSignupsAction() {
    noStore();
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        console.log("[AuditAction] Fetching all types of pending signups...");
        // Fetch from all 3 collections
        // 1. Events
        const eventSignups = (await getSystemDirectus().request(readItems('event_signups', {
            fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['name'] }] as any,
            filter: { payment_status: { _eq: 'open' } },
            sort: ['-created_at'] as any
        }))) as any[];

        // 2. Pub Crawl
        const pubCrawlSignups = (await getSystemDirectus().request(readItems('pub_crawl_signups' as any, {
            fields: [...PUB_CRAWL_SIGNUP_FIELDS, { pub_crawl_event_id: ['name'] }] as any,
            filter: { payment_status: { _eq: 'open' } },
            sort: ['-created_at'] as any
        }))) as any[];

        // 3. Trips
        const tripSignups = (await getSystemDirectus().request(readItems('trip_signups' as any, {
            fields: [...TRIP_SIGNUP_FIELDS, { trip_id: ['name'] }] as any,
            filter: { status: { _eq: 'registered' } },
            sort: ['-created_at'] as any
        }))) as any[];

        // 4. Memberships (Paid but pending manual approval)
        const membershipSignups = (await getSystemDirectus().request(readItems('transactions' as any, {
            fields: ['mollie_id', 'created_at', 'email', 'first_name', 'last_name', 'product_name', 'amount', 'payment_status', 'approval_status', 'user_id'],
            filter: {
                _and: [
                    { product_type: { _eq: 'membership' } },
                    { payment_status: { _eq: 'paid' } },
                    { approval_status: { _eq: 'pending' } }
                ]
            },
            sort: ['-created_at'] as any
        }))) as any[];
        console.log(`[AuditAction] Found ${membershipSignups.length} pending memberships.`);

        // Aggregate and map
        const aggregated: PendingSignup[] = [
            ...membershipSignups.map((s: any) => ({
                id: s.mollie_id,
                created_at: s.created_at,
                email: s.email,
                first_name: s.first_name,
                last_name: s.last_name,
                product_name: s.product_name,
                amount: parseFloat(s.amount || '0'),
                approval_status: 'pending' as any,
                payment_status: s.payment_status,
                type: (s.user_id ? 'membership_renewal' : 'membership_new') as any
            })),
            ...eventSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.created_at,
                email: s.participant_email,
                first_name: s.participant_name.split(' ')[0],
                last_name: s.participant_name.split(' ').slice(1).join(' '),
                product_name: s.event_id?.name || 'Onbekend Event',
                amount: 0,
                approval_status: 'pending' as any,
                payment_status: s.payment_status,
                type: 'event' as const
            })),
            ...pubCrawlSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.created_at,
                email: s.email,
                first_name: s.name.split(' ')[0],
                last_name: s.name.split(' ').slice(1).join(' '),
                product_name: s.pub_crawl_event_id?.name || 'Kroegentocht',
                amount: 0,
                approval_status: 'pending' as any,
                payment_status: s.payment_status,
                type: 'pub_crawl' as const
            })),
            ...tripSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.created_at,
                email: s.email,
                first_name: s.first_name,
                last_name: s.last_name,
                product_name: s.trip_id?.name || 'Studiereis',
                amount: 0,
                approval_status: s.approval_status as any,
                payment_status: s.payment_status,
                type: 'trip' as const
            }))
        ];

        return { success: true, data: aggregated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) };
    } catch (err) {
        console.error("[AuditAction] Fetch error:", err);
        return { success: false, error: "Kon inschrijvingen niet ophalen." };
    }
}

export async function approveSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const collection = type === 'event' ? 'event_signups' : type === 'pub_crawl' ? 'pub_crawl_signups' : 'trip_signups';

    try {
        if (type.startsWith('membership')) {
            // Internal call to finance-service to release the payment and trigger Azure sync
            const res = await fetch(`${process.env.FINANCE_SERVICE_URL}/api/payments/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
                },
                body: JSON.stringify({ mollieId: id })
            });

            if (!res.ok) throw new Error(`Finance approval failed: ${await res.text()}`);
        } else {
            await getSystemDirectus().request(updateItem(collection as any, id as any, { approval_status: 'approved' }));
        }
        
        await logAdminAction('signup_approved', 'SUCCESS', { 
            signup_id: id, 
            type: type 
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (err) {
        console.error("[AuditAction] Approve error:", err);
        return { success: false, error: "Goedkeuren mislukt." };
    }
}

export async function rejectSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const collection = type === 'event' ? 'event_signups' : type === 'pub_crawl' ? 'pub_crawl_signups' : 'trip_signups';

    try {
        if (type.startsWith('membership')) {
            // Update transaction to rejected
            const { query } = await import('@/lib/db');
            await query('UPDATE transactions SET approval_status = $1 WHERE mollie_id = $2', ['rejected', id]);
        } else {
            await getSystemDirectus().request(updateItem(collection as any, id as any, { approval_status: 'rejected' }));
        }
        
        await logAdminAction('signup_rejected', 'SUCCESS', { 
            signup_id: id, 
            type: type 
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (err) {
        console.error("[AuditAction] Reject error:", err);
        return { success: false, error: "Afwijzen mislukt." };
    }
}

export async function getAuditSettingsAction() {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { rows } = await query('SELECT is_active FROM feature_flags WHERE name = $1 LIMIT 1', ['manual_approval']);
        
        const flag = rows?.[0];
        return { success: true, data: { manual_approval: !!flag?.is_active } };
    } catch (e) {
        console.error("[AuditAction] Settings fetch error (SQL):", e);
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { rows } = await query('SELECT id FROM feature_flags WHERE name = $1 LIMIT 1', ['manual_approval']);
        const flagId = rows?.[0]?.id;

        if (flagId) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [manualApproval, flagId]);
            console.log(`[AuditAction] Update setting (SQL): manual_approval = ${manualApproval}`);
        } else {
            await query('INSERT INTO feature_flags (name, is_active, route_match) VALUES ($1, $2, $3)', 
                ['manual_approval', manualApproval, 'SYSTEM']);
            console.log(`[AuditAction] Create setting (SQL): manual_approval = ${manualApproval}`);
        }
        
        await logAdminAction('settings_change', 'SUCCESS', { 
            setting: 'manual_approval', 
            value: manualApproval 
        });

        revalidateTag('audit_settings', 'default');
        return { success: true };
    } catch (error) {
        console.error("[AuditAction] Settings update error (SQL):", error);
        return { success: false, error: "Bijwerken instellingen mislukt." };
    }
}

export async function getSystemLogsAction(limit: number = 50) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const logs = await getSystemDirectus().request(readItems('system_logs' as any, {
            fields: [...SYSTEM_LOG_FIELDS],
            sort: ['-created_at'],
            limit
        }));
        
        return { success: true, data: logs };
    } catch (err) {
        console.error("[AuditAction] Logs fetch error:", err);
        return { success: false, error: "Kon logs niet ophalen." };
    }
}
