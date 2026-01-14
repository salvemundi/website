'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';

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
                router.push('/login');
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
                        // User is explicitly NOT in any committee
                        console.log('[AdminLayout] User NOT authorized - no committees, redirecting to home');
                        setIsAuthorized(false);
                        router.push('/');
                    }
                } else {
                    // Fallback: Check if user is member of any committee via API
                    console.log('[AdminLayout] Committees not loaded, checking via API');
                    const query = new URLSearchParams({
                        'filter[user_id][_eq]': user.id,
                        'limit': '1',
                    }).toString();

                    const memberships = await directusFetch<any[]>(`/items/committee_members?${query}`);
                    console.log('[AdminLayout] API response:', memberships);

                    if (Array.isArray(memberships) && memberships.length > 0) {
                        console.log('[AdminLayout] User authorized via API');
                        setIsAuthorized(true);
                    } else {
                        // Not a committee member
                        console.log('[AdminLayout] User NOT authorized via API, redirecting to home');
                        setIsAuthorized(false);
                        router.push('/');
                    }
                }
            } catch (error) {
                console.error('Authorization check failed:', error);
                setIsAuthorized(false);
                router.push('/');
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

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end">
            {children}
        </div>
    );
}
