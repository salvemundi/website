// Helper utilities for committee membership checks
export function normalizeCommitteeName(name: string | null | undefined) {
    if (!name) return '';
    return name
        .toString()
        .toLowerCase()
        .replace(/\|\|\s*salve mundi/gi, '')
        .replace(/[^a-z0-9]/g, ''); // remove spaces/punctuation
}

// Returns true if the given user object (from useAuth) belongs to any of the
// allowed committee identifiers. The check is permissive: it normalizes
// committee names and matches on known tokens like 'reis', 'ict' or 'bestuur'.
export function isUserAuthorizedForReis(user: any): boolean {
    if (!user) return false;

    const allowedTokens = ['reiscommissie', 'reis', 'ictcommissie', 'ict', 'bestuur'];

    const committees: any[] = (user as any).committees || [];
    // If committees may be stored as simple strings, map accordingly
    const names = committees.map((c: any) => {
        if (!c) return '';
        if (typeof c === 'string') return normalizeCommitteeName(c);
        if (c.name) return normalizeCommitteeName(c.name);
        if (c.committee_id && c.committee_id.name) return normalizeCommitteeName(c.committee_id.name);
        return '';
    });

    for (const n of names) {
        if (!n) continue;
        for (const token of allowedTokens) {
            if (n.includes(token)) return true;
        }
    }

    return false;
}

// Returns true if the given user object (from useAuth) belongs to any committee.
export function isUserAuthorizedForKroegentocht(user: any): boolean {
    if (!user) return false;

    const committees: any[] = (user as any).committees || [];
    // Anyone in any committee can access kroegentocht management
    return committees.length > 0;
}
