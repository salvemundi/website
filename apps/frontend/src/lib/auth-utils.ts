/**
 * Authentication and authorization utilities for Salve Mundi V7.
 */

/**
 * Checks if a user has "Super Admin" privileges (Bestuur, ICT, Kandi).
 * This logic is used both on the server and client to gate administrative features.
 * 
 * @param committees List of committees (either as objects or just names/IDs)
 * @returns boolean
 */
export function isSuperAdmin(committees: any[] | null | undefined): boolean {
    if (!committees || !Array.isArray(committees)) return false;
    
    return committees.some((c: any) => {
        // Handle both enriched objects from SDK and simpler prop-based structures
        const name = (c?.name || c?.committee_id?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });
}

/**
 * Checks if a user is a member of any committee.
 * 
 * @param committees List of committees
 * @returns boolean
 */
export function isCommitteeMember(committees: any[] | null | undefined): boolean {
    return Array.isArray(committees) && committees.length > 0;
}
