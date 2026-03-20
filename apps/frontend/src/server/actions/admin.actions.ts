'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { 
    DashboardStatsSchema, type DashboardStats,
    RecentActivitySchema, type RecentActivity,
    TopStickerSchema, type TopSticker,
    BirthdaySchema, type Birthday
} from "@salvemundi/validations";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

async function directusFetch<T>(path: string, tags: string[] = []): Promise<T> {
    const url = `${DIRECTUS_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        next: { tags }
    });
    
    if (!res.ok) {
        console.error(`[Directus] Fetch failed for ${path}: ${res.statusText}`);
        throw new Error(`Directus fetch failed: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data as T;
}

export async function checkAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return { isAuthorized: false, user: null, isIct: false };
    }

    type CommitteeMeta = { name?: string | null };
    const user = session.user as { committees?: CommitteeMeta[], first_name?: string };
    const committees = user.committees ?? [];
    const isIct = committees.some((c) => c.name?.toLowerCase().includes('ict'));
    const isBestuur = committees.some((c) => c.name?.toLowerCase().includes('bestuur'));
    const isAdmin = isIct || isBestuur;

    return { isAuthorized: isAdmin, user, isIct };
}

export async function getDashboardPermissions() {
    const { isAuthorized, user, isIct } = await checkAdminAccess();
    if (!isAuthorized) return { canAccessIntro: false, canAccessReis: false, canAccessLogging: false, canAccessSync: false, canAccessCoupons: false, canAccessPermissions: false };

    // Placeholder until settings validation is synced properly, using legacy fallbacks
    const committees = (user as any).committees || [];
    const names = committees.map((c: any) => (c.name || '').toLowerCase());
    const hasHighPrivilege = names.some((n: string) => n.includes('ict') || n.includes('bestuur') || n.includes('kandi'));
    
    return {
        canAccessIntro: hasHighPrivilege, // replace with real check if needed
        canAccessReis: hasHighPrivilege,
        canAccessLogging: hasHighPrivilege,
        canAccessSync: hasHighPrivilege,
        canAccessCoupons: hasHighPrivilege || names.some((n: string) => n.includes('kas')),
        canAccessPermissions: names.some((n: string) => n.includes('ict') || n.includes('bestuur')),
        isIct
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    await checkAdminAccess();
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
            membersRes, 
            eventsRes, 
            signupsRes, 
            introRes, 
            couponsRes, 
            activityRes,
            allStickersRes,
            recentStickersRes,
            pubCrawlEventsRes,
            tripsRes
        ] = await Promise.all([
            directusFetch<any[]>('/users?aggregate[count]=*&filter[status][_eq]=active', ['users']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>(`/items/events?aggregate[count]=*&filter[event_date][_gte]=${today}`, ['events']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>(`/items/event_signups?aggregate[count]=*&filter[event_id][event_date][_gte]=${today}`, ['event_signups']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>('/items/intro_signups?aggregate[count]=*', ['intro_signups']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>('/items/coupons?aggregate[count]=*&filter[is_active][_eq]=true', ['coupons']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>('/items/system_logs?aggregate[count]=*&filter[level][_eq]=error', ['system_logs']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>('/items/stickers?aggregate[count]=*', ['stickers']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>(`/items/stickers?aggregate[count]=*&filter[date_created][_gte]=${lastWeek}`, ['stickers']).catch(() => [{ count: 0 }]),
            directusFetch<any[]>('/items/pub_crawl_events?fields=id,date&sort=-date', ['pub_crawl_events']).catch(() => []),
            directusFetch<any[]>('/items/trips?fields=id,start_date,end_date,event_date&filter[status][_eq]=published&sort=-start_date', ['trips']).catch(() => [])
        ]);
        
        // Calculate Pub Crawl signups for the upcoming/latest event
        let pubCrawlSignups = 0;
        const upcomingPubCrawl = pubCrawlEventsRes.find((e: any) => new Date(e.date) >= now) || pubCrawlEventsRes[0];
        if (upcomingPubCrawl) {
            const pcSignups = await directusFetch<any[]>(`/items/pub_crawl_signups?aggregate[count]=*&filter[pub_crawl_event_id][_eq]=${upcomingPubCrawl.id}`, ['pub_crawl_signups']).catch(() => [{ count: 0 }]);
            pubCrawlSignups = parseInt(pcSignups?.[0]?.count || "0");
        }

        // Calculate Reis signups for the active trip
        let reisSignups = 0;
        const activeTrip = tripsRes.find((t: any) => {
            const dateStr = t.end_date || t.event_date || t.start_date;
            return dateStr && new Date(dateStr) >= now;
        }) || tripsRes[0];
        
        if (activeTrip) {
            const tSignups = await directusFetch<any[]>(`/items/trip_signups?aggregate[count]=*&filter[trip_id][_eq]=${activeTrip.id}&filter[status][_neq]=cancelled`, ['trip_signups']).catch(() => [{ count: 0 }]);
            reisSignups = parseInt(tSignups?.[0]?.count || "0");
        }

        const totalStickers = parseInt(allStickersRes?.[0]?.count || "0");
        const recentStickers = parseInt(recentStickersRes?.[0]?.count || "0");
        const stickerGrowthRate = totalStickers > 0 ? Math.round((recentStickers / totalStickers) * 100) : 0;

        const stats = {
            totalMembers: parseInt(membersRes?.[0]?.count || "0"),
            upcomingEventsCount: parseInt(eventsRes?.[0]?.count || "0"),
            pendingSignupsCount: parseInt(signupsRes?.[0]?.count || "0"),
            systemErrors: parseInt(activityRes?.[0]?.count || "0"),
            introSignups: parseInt(introRes?.[0]?.count || "0"),
            totalCoupons: parseInt(couponsRes?.[0]?.count || "0"),
            pubCrawlSignups,
            reisSignups,
            stickerGrowthRate
        };

        return DashboardStatsSchema.parse(stats);
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return { 
            totalMembers: 0, 
            upcomingEventsCount: 0, 
            pendingSignupsCount: 0, 
            systemErrors: 0, 
            introSignups: 0, 
            totalCoupons: 0, 
            pubCrawlSignups: 0, 
            reisSignups: 0,
            stickerGrowthRate: 0
        };
    }
}

export async function getUpcomingBirthdays(): Promise<Birthday[]> {
    await checkAdminAccess();
    try {
        const users = await directusFetch<any[]>('/users?fields=id,first_name,last_name,date_of_birth&filter[date_of_birth][_nnull]=true&limit=-1', ['users']);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingItems = users
            .map(user => {
                if (!user.date_of_birth) return null;
                const dob = new Date(user.date_of_birth);
                if (isNaN(dob.getTime())) return null;
                
                const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                if (nextBirthday.getTime() < today.getTime()) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }
                return {
                    id: user.id,
                    first_name: user.first_name || 'Onbekend',
                    last_name: user.last_name || '',
                    birthday: user.date_of_birth,
                    nextBirthday,
                    isToday: nextBirthday.getTime() === today.getTime()
                };
            })
            .filter((u): u is NonNullable<typeof u> => u !== null)
            .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());
            
        const result = upcomingItems.slice(0, 5).map(u => ({ 
            id: u.id, 
            first_name: u.first_name, 
            last_name: u.last_name, 
            birthday: u.birthday, 
            isToday: u.isToday 
        }));

        return z.array(BirthdaySchema).parse(result);
    } catch {
        return [];
    }
}

export async function getRecentActivities(): Promise<RecentActivity[]> {
    await checkAdminAccess();
    try {
        const events = await directusFetch<any[]>('/items/events?fields=id,name,event_date&sort=-event_date&limit=4', ['events']);
        const eventsWithSignups = await Promise.all(
            events.map(async (ev) => {
                const signups = await directusFetch<any[]>(`/items/event_signups?aggregate[count]=*&filter[event_id][_eq]=${ev.id}`, ['event_signups']).catch(() => [{ count: 0 }]);
                return {
                    id: ev.id,
                    name: ev.name,
                    event_date: ev.event_date,
                    signups: parseInt(signups?.[0]?.count || "0")
                };
            })
        );
        return z.array(RecentActivitySchema).parse(eventsWithSignups);
    } catch {
        return [];
    }
}

export async function getTopStickers(): Promise<TopSticker[]> {
    await checkAdminAccess();
    try {
        const stickers = await directusFetch<any[]>('/items/stickers?fields=user_created.id,user_created.first_name,user_created.last_name&limit=-1', ['stickers']);
        const counts: Record<string, TopSticker> = {};
        
        stickers.forEach(s => {
            const user = s.user_created;
            if (user && user.id) {
                if (!counts[user.id]) counts[user.id] = { id: user.id, first_name: user.first_name || 'Onbekend', last_name: user.last_name || '', count: 0 };
                counts[user.id].count++;
            }
        });
        
        const result = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3);
        return z.array(TopStickerSchema).parse(result);
    } catch {
        return [];
    }
}
