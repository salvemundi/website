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

    const allowedTokens = ['reiscommissie', 'ictcommissie', 'bestuur', 'kandidaatbestuur'];

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

// Returns true if the given user object (from useAuth) belongs to any of the
// allowed committee identifiers for intro. The check is permissive: it normalizes
// committee names and matches on known tokens like 'intro', 'ict' or 'bestuur'.
export function isUserAuthorizedForIntro(user: any): boolean {
    if (!user) return false;

    const allowedTokens = ['introcommissie', 'ictcommissie', 'bestuur', 'kandidaatbestuur'];

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

// Returns true ONLY if the user is in the Reiscommissie.
// This is used for automatic crew role assignment during trip signup.
export function isUserInReisCommittee(user: any): boolean {
    if (!user) return false;

    // Only Reiscommissie members should be crew
    const crewTokens = ['reiscommissie'];

    const committees: any[] = (user as any).committees || [];
    const names = committees.map((c: any) => {
        if (!c) return '';
        if (typeof c === 'string') return normalizeCommitteeName(c);
        if (c.name) return normalizeCommitteeName(c.name);
        if (c.committee_id && c.committee_id.name) return normalizeCommitteeName(c.committee_id.name);
        return '';
    });

    for (const n of names) {
        if (!n) continue;
        for (const token of crewTokens) {
            if (n.includes(token)) {
                return true;
            }
        }
    }

    return false;
}

// Returns true if the given user object belongs to Bestuur, ICT or Kascommissie
export function isUserAuthorizedForLogging(user: any): boolean {
    if (!user) return false;

    const allowedTokens = ['ictcommissie', 'bestuur', 'kascommissie', 'kandidaatbestuur'];

    const committees: any[] = (user as any).committees || [];
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

// Returns true if the user is in the ICT committee.
export function isUserInIct(user: any): boolean {
    if (!user) return false;

    const ictTokens = ['ictcommissie'];

    const committees: any[] = (user as any).committees || [];
    const names = committees.map((c: any) => {
        if (!c) return '';
        if (typeof c === 'string') return normalizeCommitteeName(c);
        if (c.name) return normalizeCommitteeName(c.name);
        if (c.committee_id && c.committee_id.name) return normalizeCommitteeName(c.committee_id.name);
        return '';
    });

    for (const n of names) {
        if (!n) continue;
        for (const token of ictTokens) {
            if (n.includes(token)) return true;
        }
    }

    return false;
}

// Checks if a user is authorized for a specific page using a list of allowed tokens.
export function isUserAuthorized(user: any, allowedTokens: string[]): boolean {
    if (!user) return false;
    if (allowedTokens.length === 0) return false;

    const committees: any[] = (user as any).committees || [];
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

// Utility to merge dynamic tokens from database with hardcoded fallback tokens
export function getMergedTokens(dynamicTokens: string | string[] | undefined | null, fallbackTokens: string[]): string[] {
    if (!dynamicTokens) return fallbackTokens;

    let dynamic: string[] = [];
    if (Array.isArray(dynamicTokens)) {
        dynamic = dynamicTokens.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof dynamicTokens === 'string') {
        dynamic = dynamicTokens.split(',').map(t => t.trim()).filter(Boolean);
    }

    return dynamic.length > 0 ? dynamic : fallbackTokens;
}
