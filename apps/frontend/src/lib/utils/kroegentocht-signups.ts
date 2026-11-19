/**
 * Gedeelde helpers voor kroegentocht-aanmeldingen (client + server).
 *
 * Eén aanmelding (signup) kan meerdere tickets/deelnemers bevatten. De eerste
 * deelnemer is altijd de persoon die zich heeft ingeschreven.
 */

export interface KroegParticipant {
    name: string;
    initial: string;
}

export interface KroegSignupLike {
    id?: number | string | null;
    name: string;
    email?: string | null;
    association?: string | null;
    amount_tickets: number;
    group_name?: string | null;
    payment_status?: string | null;
    participants?: unknown;
}

export function parseParticipants(signup: KroegSignupLike): KroegParticipant[] {
    let raw = signup.participants;
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw) as unknown;
        } catch {
            return [];
        }
    }
    if (!Array.isArray(raw)) return [];
    return raw.filter((p): p is KroegParticipant => !!p && typeof p === 'object' && typeof (p as KroegParticipant).name === 'string');
}

export function formatParticipantName(p: KroegParticipant): string {
    const name = (p.name || '').trim() || 'Onbekend';
    const initial = (p.initial || '').trim();
    return initial ? `${name} ${initial.replace(/\.$/, '')}.` : name;
}

/**
 * Alle deelnemersnamen van een aanmelding, met de inschrijver als eerste.
 * Lengte is altijd gelijk aan amount_tickets (aangevuld met placeholders).
 */
export function getParticipantNames(signup: KroegSignupLike): string[] {
    const ps = parseParticipants(signup);
    const names = ps.map(formatParticipantName);
    if (names.length === 0) names.push(signup.name);
    const total = Math.max(signup.amount_tickets || 0, names.length);
    for (let i = names.length; i < total; i++) {
        names.push(`Deelnemer ${i + 1} (${signup.name})`);
    }
    return names;
}

/** Normaliseert tekst voor zoeken: kleine letters, zonder accenten/leestekens. */
export function normalizeSearch(value: string | null | undefined): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLocaleLowerCase('nl')
        .replace(/[^a-z0-9@]+/g, ' ')
        .trim();
}

/**
 * Zoekt in naam, e-mail, vereniging, groep en álle deelnemersnamen.
 * Elk los woord in de zoekopdracht moet ergens voorkomen (volgorde maakt niet uit).
 */
export function signupMatchesSearch(signup: KroegSignupLike, query: string): boolean {
    const tokens = normalizeSearch(query).split(' ').filter(Boolean);
    if (tokens.length === 0) return true;
    const haystack = normalizeSearch([
        signup.name,
        signup.email,
        signup.association,
        signup.group_name ?? 'niet ingedeeld',
        ...getParticipantNames(signup)
    ].join(' | '));
    return tokens.every(t => haystack.includes(t));
}

/** Haalt het spreadsheet-ID uit een volledige Google Sheets-URL, of geeft het ID zelf terug. */
export function extractGoogleSheetId(input: string | null | undefined): string | null {
    const value = (input ?? '').trim();
    if (!value) return null;
    const fromUrl = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(value);
    if (fromUrl) return fromUrl[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(value) ? value : null;
}

export function normalizeAssociation(value: string | null | undefined): string {
    const trimmed = (value ?? '').trim().replace(/\s+/g, ' ');
    return trimmed || 'Onbekend';
}

export interface AssociationStat {
    association: string;
    signups: number;
    participants: number;
}

/** Totaal aantal inschrijvingen en deelnemers per vereniging (hoofdletterongevoelig samengevoegd). */
export function getAssociationStats(signups: KroegSignupLike[]): AssociationStat[] {
    const map = new Map<string, AssociationStat>();
    for (const s of signups) {
        const label = normalizeAssociation(s.association);
        const key = normalizeSearch(label);
        const entry = map.get(key) ?? { association: label, signups: 0, participants: 0 };
        // Toon de 'netste' schrijfwijze (met hoofdletters) als label.
        if (label !== label.toLowerCase() && entry.association === entry.association.toLowerCase()) entry.association = label;
        entry.signups += 1;
        entry.participants += s.amount_tickets || 0;
        map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.participants - a.participants || a.association.localeCompare(b.association, 'nl'));
}
