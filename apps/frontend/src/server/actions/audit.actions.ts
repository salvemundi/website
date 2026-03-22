'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus, getUserDirectus } from "@/lib/directus";
import { 
    readItems, 
    updateItem,
    readSingleton,
    createItem
} from "@directus/sdk";
import { PendingSignup } from "@salvemundi/validations";
import { isSuperAdmin } from "@/lib/auth-utils";

/**
 * Helper to log admin actions to the audit_logs collection.
 */
export async function logAdminAction(action: string, collection: string, id: string | number, data?: any) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const userId = session?.user?.id;
        
        await getSystemDirectus().request(createItem('audit_logs' as any, {
            user_id: userId || null,
            action,
            target_collection: collection,
            target_id: String(id),
            data: data ? JSON.stringify(data) : null
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
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        // Fetch from all 3 collections
        // 1. Events
        const eventSignups = (await getSystemDirectus().request(readItems('event_signups', {
            fields: ['id', 'date_created', 'participant_name', 'participant_email', 'approval_status', 'payment_status', { event_id: ['name'] }] as any,
            filter: { approval_status: { _eq: 'pending' } },
            sort: ['-date_created']
        }))) as any[];

        // 2. Pub Crawl
        const pubCrawlSignups = (await getSystemDirectus().request(readItems('pub_crawl_signups' as any, {
            fields: ['id', 'date_created', 'name', 'email', 'approval_status', 'payment_status', { pub_crawl_event_id: ['name'] }] as any,
            filter: { approval_status: { _eq: 'pending' } },
            sort: ['-date_created']
        }))) as any[];

        // 3. Trips
        const tripSignups = (await getSystemDirectus().request(readItems('trip_signups' as any, {
            fields: ['id', 'date_created', 'first_name', 'last_name', 'email', 'approval_status', 'payment_status', { trip_id: ['name'] }] as any,
            filter: { approval_status: { _eq: 'pending' } },
            sort: ['-date_created']
        }))) as any[];

        // Aggregate and map
        const aggregated: PendingSignup[] = [
            ...eventSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.date_created,
                email: s.participant_email,
                first_name: s.participant_name.split(' ')[0],
                last_name: s.participant_name.split(' ').slice(1).join(' '),
                product_name: s.event_id?.name || 'Onbekend Event',
                amount: 0, // In V7 prices are on the event, not the signup
                approval_status: s.approval_status as any,
                payment_status: s.payment_status,
                type: 'event' as const
            })),
            ...pubCrawlSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.date_created,
                email: s.email,
                first_name: s.name.split(' ')[0],
                last_name: s.name.split(' ').slice(1).join(' '),
                product_name: s.pub_crawl_event_id?.name || 'Kroegentocht',
                amount: 0,
                approval_status: s.approval_status as any,
                payment_status: s.payment_status,
                type: 'pub_crawl' as const
            })),
            ...tripSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.date_created,
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
        await getUserDirectus(admin.session.token).request(updateItem(collection as any, id as any, { approval_status: 'approved' }));
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
        await getUserDirectus(admin.session.token).request(updateItem(collection as any, id as any, { approval_status: 'rejected' }));
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
        // App settings is often a singleton or a specific collection
        // Based on ERD, it's a "NIEUW" table. Assuming it's a singleton called 'app_settings'
        const settings = await getSystemDirectus().request(readSingleton('app_settings' as any)).catch(() => ({ manual_approval: false }));
        return { success: true, data: settings };
    } catch {
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        // Assuming singleton update
        await getUserDirectus(admin.session.token).request(updateItem('app_settings' as any, undefined as any, { manual_approval: manualApproval }));
        revalidateTag('app_settings', 'default');
        return { success: true };
    } catch (err) {
        console.error("[AuditAction] Settings update error:", err);
        return { success: false, error: "Bijwerken instellingen mislukt." };
    }
}
