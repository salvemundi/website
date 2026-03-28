/**
 * Authentication and authorization utilities for Salve Mundi V7.
 */

import { hasPermission, type Committee } from '@/shared/lib/permissions';
import { AdminResource } from '@/shared/lib/permissions-config';

/**
 * Checks if a user has "Super Admin" privileges.
 * This logic is used both on the server and client to gate administrative features.
 * 
 * @param committees List of committees
 * @returns boolean
 */
export function isSuperAdmin(committees: Committee[] | null | undefined): boolean {
    if (!committees || !Array.isArray(committees)) return false;
    
    // We use the Intro resource as a general "SuperAdmin" check
    return hasPermission(committees, AdminResource.Intro);
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
