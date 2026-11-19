import { type ProfileEventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type EnrichedPubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { type EnrichedUser } from '@/types/auth';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function parseValidDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export type ProfileSignupItem =
    | (ProfileEventSignup & { _type: 'event' })
    | (EnrichedPubCrawlSignup & { _type: 'pub_crawl' });

export function calculateMembershipStatus(user: EnrichedUser): {
    text: string;
    color: 'brand-light' | 'brand-filled' | 'error';
    textColor: 'brand' | 'white';
} {
    const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;
    const isLeader = !!user.permissions?.includes('leader');
    const status = user.membership_status;

    const isBestuur = !!user.committees?.some(c => c.name.toLowerCase().includes('bestuur'));

    let role = 'Lid';
    if (isBestuur) role = 'Bestuur';
    else if (user.permissions?.includes('ict')) role = 'ICT';
    else if (isLeader) role = 'Commissie Leider';
    else if (isCommitteeMember) role = 'Actief Lid';

    let statusText = 'Geen status';
    if (status === 'active') statusText = 'Actief';
    else if (status === 'expired') statusText = 'Verlopen';

    let color: 'brand-light' | 'brand-filled' | 'error' = 'brand-light';
    let textColor: 'brand' | 'white' = 'brand';

    if (status === 'active') {
        color = 'brand-filled';
        textColor = 'white';
    } else if (status === 'expired') {
        color = 'error';
        textColor = 'white';
    }

    return { text: `${role} • ${statusText}`, color, textColor };
}

function getSignupDate(signup: ProfileSignupItem): string | null | undefined {
    return signup._type === 'event'
        ? signup.event_id?.event_date
        : signup.pub_crawl_event_id.date;
}

export function filterProfileSignups(
    eventSignups: ProfileEventSignup[],
    pubCrawlSignups: EnrichedPubCrawlSignup[],
    showPastEvents: boolean
): ProfileSignupItem[] {
    const todayStart = startOfDay(new Date());

    let allSignups: ProfileSignupItem[] = [
        ...eventSignups.map(s => ({ ...s, _type: 'event' as const })),
        ...pubCrawlSignups.map(s => ({ ...s, _type: 'pub_crawl' as const }))
    ];

    if (!showPastEvents) {
        allSignups = allSignups.filter((s) => {
            const parsedDate = parseValidDate(getSignupDate(s));
            if (!parsedDate) return true;
            return startOfDay(parsedDate).getTime() >= todayStart.getTime();
        });
    }

    return allSignups.sort((a, b) => {
        const dateA = parseValidDate(getSignupDate(a));
        const dateB = parseValidDate(getSignupDate(b));
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB.getTime() - dateA.getTime();
    });
}
