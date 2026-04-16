import { requireAdminResource } from '../auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';

/**
 * Legacy wrapper for Reis Admin authorization.
 * Now points to the unified requireAdminResource utility.
 */
export async function requireReisAdmin() {
    return requireAdminResource(AdminResource.Reis);
}
