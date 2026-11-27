// Gedeelde types voor Samu Wrapped (server -> client, alles serialiseerbaar)

export interface WrappedNamedCount {
    name: string;
    count: number;
}

export interface WrappedStickerHighlight {
    place: string;
    distanceKm: number;
}

export interface WrappedPersona {
    title: string;
    description: string;
    emoji: string;
}

export interface WrappedBadge {
    id: string;
    emoji: string;
    title: string;
    description: string;
}

export interface SamuWrappedStats {
    year: number;
    firstName: string;

    activities: {
        total: number;
        checkedIn: number;
        topCommittee: WrappedNamedCount | null;
        busiestMonth: WrappedNamedCount | null;
        favoriteWeekday: WrappedNamedCount | null;
        distinctLocations: number;
        /** Langste reeks opeenvolgende activiteiten (in de agenda) waarvoor je je aanmeldde */
        longestSignupRun: { count: number; events: string[] };
        /** Snelste aanmelding na publicatie (in seconden) */
        fastestSignup: { name: string; seconds: number } | null;
        /** Unieke datums (YYYY-MM-DD) waarop je bij een activiteit was, voor de jaar-heatmap */
        dates: string[];
    };

    /** Cijfers van de hele vereniging over het jaar (geen persoonsgegevens) */
    samu: {
        events: number;
        signups: number;
        participants: number;
        stickers: number;
        pubCrawlTickets: number;
        trips: number;
    };

    pubCrawls: {
        total: number;
        tickets: number;
    };

    stickers: {
        total: number;
        allTime: number;
        cities: number;
        countries: number;
        farthest: WrappedStickerHighlight | null;
    };

    trips: string[];

    merch: {
        items: number;
    };

    committees: {
        names: string[];
        leaderOf: number;
    };

    membership: {
        memberSince: string | null; // YYYY-MM-DD
        /** Aantal dagen echt lid; periodes zonder lidmaatschap tellen niet mee */
        daysMember: number | null;
        /** true als er periodes tussen zaten waarin iemand geen lid was */
        hadBreak: boolean;
    };

    totalSpent: number;

    /**
     * "Je hoort bij de top X%": samengestelde score over alle stats van het jaar
     * (activiteiten, kroegentochten, reizen, stickers, webshop-items, commissies).
     * null bij te weinig deelnemers of een score van 0.
     */
    topPercent: number | null;

    persona: WrappedPersona;

    badges: {
        /** De zeldzaamste verdiende badge — staat op de deelkaart. Iedereen krijgt er één. */
        featured: WrappedBadge;
        /** Overige verdiende badges, zeldzaamste eerst */
        others: WrappedBadge[];
    };
}

export type SamuWrappedResult =
    | { status: 'ok'; stats: SamuWrappedStats }
    | { status: 'unavailable' };
