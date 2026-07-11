'use client';

import { type EventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type EnrichedPubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';

interface LocalEventSignup {
    event_id?: { event_date?: string | null } | null;
}

interface LocalPubCrawlSignup {
    pub_crawl_event_id?: { date?: string | null } | null;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export type CommitteeMeta = {
    id: string | number;
    name?: string | null;
    is_leader?: boolean | null;
};

export type SessionUser = {
    id?: string | number;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    fontys_email?: string | null;
    membership_status?: string | null;
    membership_expiry?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
    avatar?: string | null;
    image?: string | null;
    minecraft_username?: string | null;
    committees?: CommitteeMeta[] | null;
    permissions?: string[] | null;
    entra_id?: string | null;
};

export function mergeUserData(sUser: SessionUser | null | undefined, initialUser: SessionUser): SessionUser {
    if (!sUser) return initialUser;

    const mergedUser = {
        ...sUser,
        minecraft_username: initialUser.minecraft_username ?? sUser.minecraft_username,
        phone_number: initialUser.phone_number ?? sUser.phone_number,
        membership_status: initialUser.membership_status ?? sUser.membership_status,
        membership_expiry: initialUser.membership_expiry ?? sUser.membership_expiry,
        date_of_birth: initialUser.date_of_birth ?? sUser.date_of_birth,
        entra_id: initialUser.entra_id ?? sUser.entra_id,
        permissions: initialUser.permissions ?? sUser.permissions ?? [],
    };

    if (!mergedUser.name && (mergedUser.first_name || mergedUser.last_name)) {
        mergedUser.name = `${mergedUser.first_name || ''} ${mergedUser.last_name || ''}`.trim();
    }

    mergedUser.committees = initialUser.committees ?? sUser.committees;

    return mergedUser;
}

export function calculateMembershipStatus(user: SessionUser) {
    const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;
    const isLeader = !!user.permissions?.includes('leader');
    const status = user.membership_status;
    const isMember = status === 'active';

    const isBestuur = !!user.committees?.some(c => c.name?.toLowerCase().includes('bestuur'));

    let role = "Lid";
    if (isBestuur) role = "Bestuur";
    else if (user.permissions?.includes('ict')) role = "ICT";
    else if (isLeader) role = "Commissie Leider";
    else if (isCommitteeMember) role = "Actief Lid";
    else role = "Lid";

    let statusText = "Geen status";
    if (status === "active") statusText = "Actief";
    else if (status === "expired") statusText = "Verlopen";

    let color = "bg-slate-100 dark:bg-white/5 border border-purple-200 text-purple-700 dark:text-white";
    let textColor = "text-purple-700 dark:text-white font-bold";

    if (status === "active") {
        if (user.permissions?.includes('ict') || isLeader) {
            color = "bg-gradient-to-r from-purple-500 to-purple-400 shadow-lg";
            textColor = "text-white";
        } else if (isCommitteeMember || isMember) {
            color = "bg-purple-500 shadow-lg";
            textColor = "text-white";
        }
    } else if (status === "expired") {
        color = "bg-red-500/80 shadow-lg";
        textColor = "text-white";
    }

    return { text: `${role} • ${statusText}`, color, textColor };
}

export function filterProfileSignups(
    eventSignups: EventSignup[],
    pubCrawlSignups: EnrichedPubCrawlSignup[],
    showPastEvents: boolean
) {
    const todayStart = startOfDay(new Date());

    let allSignups = [
        ...eventSignups.map(s => ({ ...s, _type: 'event' as const })),
        ...pubCrawlSignups.map(s => ({ ...s, _type: 'pub_crawl' as const }))
    ];

    if (!showPastEvents) {
        allSignups = allSignups.filter((s) => {
            try {
                let eventDate: Date;
                if (s._type === 'event') {
                    const es = s as unknown as LocalEventSignup;
                    const eventId = es.event_id;
                    if (!eventId?.event_date) return true;
                    eventDate = startOfDay(new Date(eventId.event_date));
                } else {
                    const ps = s as unknown as LocalPubCrawlSignup;
                    const eventData = ps.pub_crawl_event_id;
                    if (!eventData?.date) return true;
                    eventDate = startOfDay(new Date(eventData.date));
                }

                // Returns true if event is today or in the future
                return eventDate.getTime() >= todayStart.getTime();
            } catch (error) {
                safeConsoleError('[profile-admin.utils.ts][filterProfileSignups] ', error);
                return true;
            }
        });
    }

    const getEventDate = (s: typeof allSignups[number]) => {
        if (s._type === 'event') {
            return (s as unknown as LocalEventSignup).event_id?.event_date;
        } else {
            return (s as unknown as LocalPubCrawlSignup).pub_crawl_event_id?.date;
        }
    };

    return allSignups.sort((a, b) => {
        const dateA = getEventDate(a);
        const dateB = getEventDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}