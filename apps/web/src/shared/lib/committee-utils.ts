// Helper utilities for committee membership checks
import { COMMITTEE_TOKENS } from '@/shared/config/committee-tokens';

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
// Returns true if the given user object belongs to any of the
// allowed committee tokens.
function getUserTokens(user: any): string[] {
    if (!user || !user.committees) return [];

    const committees: any[] = user.committees;
    return committees.map((c: any) => {
        if (!c) return '';
        // Try precise token first
        if (c.commissie_token) return c.commissie_token;
        if (c.committee_id?.commissie_token) return c.committee_id.commissie_token;

        // Fallback to name normalization
        if (typeof c === 'string') return normalizeCommitteeName(c);
        if (c.name) return normalizeCommitteeName(c.name);
        if (c.committee_id?.name) return normalizeCommitteeName(c.committee_id.name);
        return '';
    }).filter(Boolean);
}

export function isUserAuthorizedForReis(user: any): boolean {
    const userTokens = getUserTokens(user);
    const allowedTokens = [
        COMMITTEE_TOKENS.REIS,
        COMMITTEE_TOKENS.ICT,
        COMMITTEE_TOKENS.BESTUUR,
        COMMITTEE_TOKENS.KANDI
    ];

    for (const ut of userTokens) {
        for (const allowed of allowedTokens) {
            if (ut === allowed || ut.includes(allowed)) return true;
        }
    }
    return false;
}

// Returns true if the given user object (from useAuth) belongs to any of the
// allowed committee identifiers for intro. The check is permissive: it normalizes
// committee names and matches on known tokens like 'intro', 'ict' or 'bestuur'.
export function isUserAuthorizedForIntro(user: any): boolean {
    const userTokens = getUserTokens(user);
    const allowedTokens = [
        COMMITTEE_TOKENS.INTRO,
        COMMITTEE_TOKENS.ICT,
        COMMITTEE_TOKENS.BESTUUR,
        COMMITTEE_TOKENS.KANDI
    ];

    for (const ut of userTokens) {
        for (const allowed of allowedTokens) {
            if (ut === allowed || ut.includes(allowed)) return true;
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
    const userTokens = getUserTokens(user);
    const crewTokens = [COMMITTEE_TOKENS.REIS]; // Using central token 'reis'

    for (const ut of userTokens) {
        for (const token of crewTokens) {
            if (ut === token || ut.includes(token)) return true;
        }
    }
    return false;
}

// Returns true if the given user object belongs to Bestuur, ICT or Kascommissie
export function isUserAuthorizedForLogging(user: any): boolean {
    const userTokens = getUserTokens(user);
    const allowedTokens = [
        COMMITTEE_TOKENS.ICT,
        COMMITTEE_TOKENS.BESTUUR,
        COMMITTEE_TOKENS.KANDI
    ];

    for (const ut of userTokens) {
        for (const allowed of allowedTokens) {
            if (ut === allowed || ut.includes(allowed)) return true;
        }
    }
    return false;
}

// Returns true if the user is in the ICT committee.
export function isUserInIct(user: any): boolean {
    const userTokens = getUserTokens(user);
    const ictTokens = [COMMITTEE_TOKENS.ICT];

    for (const ut of userTokens) {
        for (const token of ictTokens) {
            if (ut === token || ut.includes(token)) return true;
        }
    }
    return false;
}

// Checks if a user is authorized for a specific page using a list of allowed tokens.
export function isUserAuthorized(user: any, allowedTokens: string[]): boolean {
    if (allowedTokens.length === 0) return false;
    const userTokens = getUserTokens(user);

    for (const ut of userTokens) {
        for (const allowed of allowedTokens) {
            if (ut === allowed || ut.includes(allowed)) return true;
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
