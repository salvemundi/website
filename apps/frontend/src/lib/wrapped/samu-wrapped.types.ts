// Gedeelde types voor Samu Wrapped (server -> client, alles serialiseerbaar)

export interface WrappedNamedCount {
    name: string;
    count: number;
}

export interface WrappedEventRef {
    name: string;
    date: string; // YYYY-MM-DD
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

export interface SamuWrappedStats {
    year: number;
    firstName: string;

    activities: {
        total: number;
        checkedIn: number;
        firstEvent: WrappedEventRef | null;
        lastEvent: WrappedEventRef | null;
        topCommittee: WrappedNamedCount | null;
        busiestMonth: WrappedNamedCount | null;
        favoriteWeekday: WrappedNamedCount | null;
        distinctLocations: number;
        /** "Je hoort bij de top X% van actiefste Samu'ers" — null als er te weinig data is */
        topPercent: number | null;
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

    persona: WrappedPersona;
}

export type SamuWrappedResult =
    | { status: 'ok'; stats: SamuWrappedStats }
    | { status: 'unavailable' };
