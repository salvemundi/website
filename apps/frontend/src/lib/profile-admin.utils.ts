import { startOfDay, isBefore } from 'date-fns';
import { type EventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

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
    isAdmin?: boolean;
    isLeader?: boolean;
    isICT?: boolean;
    canAccessIntro?: boolean;
    entra_id?: string | null;
};

/**
 * Merges client session user with enriched server data.
 */
export function mergeUserData(sUser: SessionUser | null | undefined, initialUser: SessionUser): SessionUser {
    // NUCLEAR SSR: Start with server-provided enriched user if no session
    if (!sUser) return initialUser;

    // Merge client session with fresh server metadata
    const mergedUser = {
        ...sUser,
        minecraft_username: initialUser?.minecraft_username ?? sUser.minecraft_username,
        phone_number: initialUser?.phone_number ?? sUser.phone_number,
        membership_status: initialUser?.membership_status ?? sUser.membership_status,
        membership_expiry: initialUser?.membership_expiry ?? sUser.membership_expiry,
        date_of_birth: initialUser?.date_of_birth ?? sUser.date_of_birth,
        entra_id: initialUser?.entra_id ?? sUser.entra_id 
    };

    // Enrich name if missing on client
    if (!mergedUser.name && (mergedUser.first_name || mergedUser.last_name)) {
        mergedUser.name = `${mergedUser.first_name || ''} ${mergedUser.last_name || ''}`.trim();
    }
    
    // Merge committees from initialUser if missing in session
    if (!mergedUser.committees && initialUser?.committees) {
        mergedUser.committees = initialUser.committees;
    }
    
    return mergedUser;
}

/**
 * Calculates membership status text and style tokens.
 */
export function calculateMembershipStatus(user: SessionUser) {
    const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;
    const isLeader = !!user.isLeader;
    const isAdmin = !!(user.isAdmin || user.canAccessIntro || user.isICT);
    const status = user.membership_status;
    const isMember = status === 'active';

    const isBestuur = !!user.committees?.some(c => c.name?.toLowerCase().includes('bestuur'));
    const isICTMember = !!user.isICT;

    let role = "Lid";
    if (isBestuur) role = "Bestuur";
    else if (isICTMember) role = "ICT";
    else if (isLeader) role = "Commissie Leider";
    else if (isCommitteeMember) role = "Actief Lid";
    else role = "Lid";

    let statusText = "Geen status";
    if (status === "active") statusText = "Actief";
    else if (status === "expired") statusText = "Verlopen";

    let color = "bg-slate-100 dark:bg-white/5 border border-[var(--color-purple-200)] text-[var(--color-purple-700)] dark:text-white";
    let textColor = "text-[var(--color-purple-700)] dark:text-white font-bold";

    if (status === "active") {
        if (isAdmin || isLeader) {
            color = "bg-gradient-to-r from-[var(--color-purple-500)] to-[var(--color-purple-400)] shadow-lg";
            textColor = "text-white";
        } else if (isCommitteeMember || isMember) {
            color = "bg-[var(--color-purple-500)] shadow-lg";
            textColor = "text-white";
        }
    } else if (status === "expired") {
        color = "bg-red-500/80 shadow-lg";
        textColor = "text-white";
    }

    return { text: `${role} • ${statusText}`, color, textColor };
}

/**
 * Filters and merges event and pub crawl signups.
 */
export function filterProfileSignups(
    eventSignups: EventSignup[], 
    pubCrawlSignups: PubCrawlSignup[], 
    showPastEvents: boolean
) {
    const todayStart = startOfDay(new Date());
    
    const allSignups = [
        ...(eventSignups || []).map(s => ({ ...s, _type: 'event' as const })),
        ...(pubCrawlSignups || []).map(s => ({ ...s, _type: 'pub_crawl' as const }))
    ];

    if (showPastEvents) return allSignups;

    return allSignups.filter((s) => {
        try {
            let eventDate;
            if (s._type === 'event') {
                const es = s as EventSignup & { _type: 'event' };
                if (!es?.event_id?.event_date) return true;
                eventDate = startOfDay(new Date(es.event_id.event_date));
            } else {
                const ps = s as PubCrawlSignup & { _type: 'pub_crawl' };
                const eventData = ps.pub_crawl_event_id;
                if (typeof eventData !== 'object' || !eventData || !('date' in eventData)) return true;
                const dateVal = (eventData as { date?: string | null }).date;
                if (!dateVal) return true;
                eventDate = startOfDay(new Date(dateVal));
            }
            return !isBefore(eventDate, todayStart);
        } catch {
            return true;
        }
    });
}
