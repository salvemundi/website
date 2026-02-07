'use client';

import { useEffect, useState } from 'react';
import { useAuthUser } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import ProtectedRoute from '@/components/ProtectedRoute';
import NoAccessOverlay from '@/components/AuthOverlay/NoAccessOverlay';

/**
 * AdminLayout - Protected layout for all admin pages
 * 
 * Architecture: Two-layer protection
 * 1. ProtectedRoute: Ensures user is authenticated
 * 2. AdminLayoutContent: Verifies committee membership (business logic)
 * 
 * This separation keeps auth concerns isolated from business authorization.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requireAuth>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </ProtectedRoute>
    );
}

/**
 * AdminLayoutContent - Committee membership authorization
 * Only authenticated users reach this component (via ProtectedRoute)
 * Here we verify committee membership for admin access
 */
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const user = useAuthUser();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuthorization = async () => {
            setIsAuthorized(false);

            // At this point, user is guaranteed to be authenticated (by ProtectedRoute)
            if (!user) {
                // Should never happen, but defensive
                setIsChecking(false);
                return;
            }

            try {
                // Check if user is member of any committee
                const committees = (user as any).committees;

                console.log('[AdminLayout] Checking authorization for user:', user.id);
                console.log('[AdminLayout] User committees:', committees);

                // First check if committees were already loaded during authentication
                if (Array.isArray(committees)) {
                    // User has committees data loaded - check if they're in any committee
                    if (committees.length > 0) {
                        console.log('[AdminLayout] User authorized - has committees:', committees.length);
                        setIsAuthorized(true);
                    } else {
                        // User is explicitly NOT in any committee - show no-access page
                        console.log('[AdminLayout] User NOT authorized - no committees');
                        setIsAuthorized(false);
                    }
                } else {
                    // Fallback: Check if user is member of any visible committee via API
                    console.log('[AdminLayout] Committees not loaded, checking via API');

                    // Get user's committee memberships with committee details
                    const memberships = await directusFetch<any[]>(
                        `/items/committee_members?filter[user_id][_eq]=${user.id}&fields=committee_id.id,committee_id.is_visible`
                    );
                    console.log('[AdminLayout] API response:', memberships);

                    // Check if user is member of at least one visible committee
                    const hasVisibleCommittee = Array.isArray(memberships) &&
                        memberships.some(m => m.committee_id?.is_visible !== false);

                    if (hasVisibleCommittee) {
                        console.log('[AdminLayout] User authorized via API - has visible committee');
                        setIsAuthorized(true);
                    } else {
                        // Not a member of any visible committee - show no-access page
                        console.log('[AdminLayout] User NOT authorized via API - no visible committees');
                        setIsAuthorized(false);
                    }
                }
            } catch (error) {
                console.error('Authorization check failed:', error);
                setIsAuthorized(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuthorization();
    }, [user]);

    // Show loading skeleton while checking committee membership
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-card)]">
                <div className="bg-admin-card rounded-3xl shadow-xl p-8 max-w-md mx-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple mx-auto mb-4" />
                    <p className="text-admin-muted">Autorisatie controleren...</p>
                </div>
            </div>
        );
    }

    // If not authorized after check, show NoAccessOverlay (in-place, no redirect)
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-card)]">
                <NoAccessOverlay
                    requiredRoles={['Commissielid']}
                    message="Deze pagina is alleen toegankelijk voor commissieleden. Je moet lid zijn van een commissie om toegang te krijgen."
                />
            </div>
        );
    }

    // Authorized: render children
    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-card)]">
            {children}
        </div>
    );
}
