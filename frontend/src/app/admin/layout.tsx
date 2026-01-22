'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import NoAccessPage from './no-access/page';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuthorization = async () => {
            // Reset authorization when starting a new check
            setIsAuthorized(false);

            if (authLoading) return;

            if (!user) {
                const returnTo = window.location.pathname + window.location.search;
                router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
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
    }, [user, authLoading, router]);

    if (authLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md mx-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">Toegang controleren...</p>
                </div>
            </div>
        );
    }

    // If not authorized, show the no-access page
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end">
                <NoAccessPage />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end">
            {children}
        </div>
    );
}
