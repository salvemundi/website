'use server';

import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { verifyUserPermissions } from './secure-check';
import { splitDutchLastName } from '@/shared/lib/utils/dutch-name';
import { COMMITTEE_TOKENS } from '@/shared/config/committee-tokens';

export interface DashboardData {
    permissions: {
        canViewIntro: boolean;
        canViewReis: boolean;
        canViewPubCrawl: boolean;
        canViewLogging: boolean;
        canViewSync: boolean;
        canViewCoupons: boolean;
        isIctMember: boolean;
    };
    stats: {
        totalSignups: number;
        upcomingBirthdays: any[];
        topStickers: any[];
        totalCommitteeMembers: number;
        upcomingEvents: number;
        totalEvents: number;
        stickerGrowthRate: number;
        introSignups: number;
        introBlogLikes: number;
        systemErrors: number;
        recentActivities: any[];
        activeCoupons: number;
        latestEventsWithSignups: any[];
        pubCrawlSignups: number;
        reisSignups: number;
    };
}

/**
 * Securely fetches dashboard data.
 * Checks permissions SERVER-SIDE before fetching sensitive stats.
 */
export async function getDashboardDataAction(): Promise<DashboardData> {
    // 1. Authenticate & Identify User
    let userContext;
    try {
        userContext = await verifyUserPermissions({});
    } catch (e) {
        throw new Error('Unauthorized');
    }

    const { committees } = userContext; // Now contains 'token' and 'isLeader'

    // 2. Determine Permissions based on Server-Side Data
    const committeeTokens = committees.map(c => c.token);

    // Helper to check against tokens
    const hasAccess = (required: string[]) => {
        return committeeTokens.some(t => required.includes(t));
    }

    const isIctMember = hasAccess([COMMITTEE_TOKENS.ICT]);
    const isBestuur = hasAccess([COMMITTEE_TOKENS.BESTUUR]);

    // Permission Rules
    const perms = {
        canViewIntro: hasAccess([COMMITTEE_TOKENS.INTRO, COMMITTEE_TOKENS.ICT, COMMITTEE_TOKENS.BESTUUR]),
        canViewReis: hasAccess([COMMITTEE_TOKENS.REIS, COMMITTEE_TOKENS.ICT, COMMITTEE_TOKENS.BESTUUR]),
        // Pub Crawl: Restricted to Bestuur, ICT or Accie (which often does events)
        canViewPubCrawl: hasAccess([COMMITTEE_TOKENS.BESTUUR, COMMITTEE_TOKENS.ICT, COMMITTEE_TOKENS.ACC]),
        canViewLogging: hasAccess([COMMITTEE_TOKENS.ICT, COMMITTEE_TOKENS.BESTUUR, COMMITTEE_TOKENS.KAS]),
        canViewSync: isIctMember || isBestuur,
        canViewCoupons: isIctMember || isBestuur || hasAccess([COMMITTEE_TOKENS.KAS]),
        isIctMember: isIctMember
    };

    // 3. Parallel Data Fetching
    const promises: Promise<any>[] = [
        serverDirectusFetch('/items/event_signups?aggregate[count]=*').catch(() => [{ count: 0 }]), // 0: Total signups
        serverDirectusFetch('/items/events?fields=id,name,event_date&limit=-1').catch(() => []),   // 1: Events (fetched once)
        // Fetch users for birthdays - restricted to essential fields
        serverDirectusFetch('/users?fields=id,first_name,last_name,date_of_birth&filter[date_of_birth][_nnull]=true&limit=-1').catch(() => []), // 2: Users
        // Fetch Stickers for top collectors
        serverDirectusFetch('/items/stickers?fields=user_created.id,user_created.first_name,user_created.last_name&limit=-1').catch(() => []), // 3: Stickers
    ];

    // Conditional Fetches
    // Intro
    if (perms.canViewIntro) {
        promises.push(serverDirectusFetch('/items/intro_signups?aggregate[count]=*').catch(() => [{ count: 0 }])); // 4
    } else {
        promises.push(Promise.resolve(null));
    }

    // System Health (Logs)
    if (perms.isIctMember) {
        promises.push(Promise.resolve({ errors: 0 })); // 5
    } else {
        promises.push(Promise.resolve(null));
    }

    // Coupons
    if (perms.canViewCoupons) {
        promises.push(serverDirectusFetch('/items/coupons?aggregate[count]=*&filter[is_active][_eq]=true').catch(() => [{ count: 0 }])); // 6
    } else {
        promises.push(Promise.resolve(null));
    }

    // Reis
    if (perms.canViewReis) {
        promises.push(serverDirectusFetch('/items/trip_signups?aggregate[count]=*').catch(() => [{ count: 0 }])); // 7
    } else {
        promises.push(Promise.resolve(null));
    }

    // Pub Crawl (Kroegentocht)
    if (perms.canViewPubCrawl) {
        promises.push(serverDirectusFetch('/items/pub_crawl_signups?aggregate[count]=*').catch(() => [{ count: 0 }])); // 8
    } else {
        promises.push(Promise.resolve(null));
    }


    // Await all
    const [
        totalSignupsRes,
        allEventsRes,
        usersRes,
        stickersRes,
        introSignupsRes,
        systemHealthRes,
        couponsRes,
        reisSignupsRes,
        pubCrawlSignupsRes
    ] = await Promise.all(promises);


    // 4. Process Data safely
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Events
    const allEvents = Array.isArray(allEventsRes) ? allEventsRes : [];
    const upcomingEvents = allEvents.filter((e: any) => new Date(e.event_date) >= now);
    const upcomingEventsCount = upcomingEvents.length;

    // Birthdays
    const users = Array.isArray(usersRes) ? usersRes : [];
    const upcomingBirthdays = users
        .map((user: any) => {
            const dob = user.date_of_birth;
            if (!dob) return null;

            let date = new Date(dob);
            if (isNaN(date.getTime())) return null;

            const currentYear = today.getFullYear();
            const nextBirthday = new Date(currentYear, date.getMonth(), date.getDate());
            nextBirthday.setHours(0, 0, 0, 0);

            if (nextBirthday.getTime() < today.getTime()) {
                nextBirthday.setFullYear(currentYear + 1);
            }

            const isToday = nextBirthday.getTime() === today.getTime();

            const { prefix, lastName } = splitDutchLastName(user.last_name || '');

            return {
                id: user.id,
                first_name: user.first_name,
                tussenvoegsel: prefix, // Extracted prefix
                last_name: lastName,   // Cleaned last name without prefix
                birthday: user.date_of_birth,
                nextBirthday: nextBirthday.getTime(), // Serializing Date to timestamp for Client Component
                isToday
            };
        })
        .filter((u: any) => u !== null)
        .sort((a: any, b: any) => a.nextBirthday - b.nextBirthday)
        .slice(0, 5)
        .map((u: any) => ({
            id: u.id,
            first_name: u.first_name,
            tussenvoegsel: u.tussenvoegsel,
            last_name: u.last_name,
            birthday: u.birthday,
            isToday: u.isToday
        }));

    // Top Sticker Collectors
    const stickers = Array.isArray(stickersRes) ? stickersRes : [];
    const stickerCounts: Record<string, any> = {};
    stickers.forEach((s: any) => {
        const user = s.user_created;
        if (user && user.id) {
            if (!stickerCounts[user.id]) {
                const { prefix, lastName } = splitDutchLastName(user.last_name || '');
                stickerCounts[user.id] = {
                    id: user.id,
                    first_name: user.first_name || 'Onbekend',
                    tussenvoegsel: prefix,
                    last_name: lastName,
                    count: 0
                };
            }
            stickerCounts[user.id].count++;
        }
    });
    const topStickers = Object.values(stickerCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);

    // Latest Events Signups
    const latestEvents = [...allEvents]
        .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        .slice(0, 4);

    // Fetch signups for these 4 events
    const latestEventsWithSignups = await Promise.all(latestEvents.map(async (ev: any) => {
        try {
            // Parallel fetch for signups
            const s = await serverDirectusFetch<any>(`/items/event_signups?aggregate[count]=*&filter[event_id][_eq]=${ev.id}`);
            return {
                id: ev.id,
                name: ev.name,
                event_date: ev.event_date,
                signups: s?.[0]?.count || 0
            };
        } catch {
            return {
                id: ev.id,
                name: ev.name,
                event_date: ev.event_date,
                signups: 0
            };
        }
    }));


    return {
        permissions: perms,
        stats: {
            totalSignups: totalSignupsRes?.[0]?.count || 0,
            upcomingBirthdays,
            topStickers,
            totalCommitteeMembers: 0,
            upcomingEvents: upcomingEventsCount,
            totalEvents: allEvents.length,
            stickerGrowthRate: 0,
            introSignups: introSignupsRes?.[0]?.count || 0,
            introBlogLikes: 0,
            systemErrors: systemHealthRes?.errors || 0,
            recentActivities: [],
            activeCoupons: couponsRes?.[0]?.count || 0,
            latestEventsWithSignups,
            pubCrawlSignups: pubCrawlSignupsRes?.[0]?.count || 0,
            reisSignups: reisSignupsRes?.[0]?.count || 0
        }
    };
}
