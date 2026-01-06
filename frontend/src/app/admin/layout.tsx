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
            if (authLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Check if user is member of any committee
                const query = new URLSearchParams({
                    'filter[user_id][_eq]': user.id,
                    'limit': '1',
                }).toString();

                const memberships = await directusFetch<any[]>(`/items/committee_members?${query}`);

                if (memberships && memberships.length > 0) {
                    setIsAuthorized(true);
                } else {
                    // Not a committee member
                    router.push('/');
                }
            } catch (error) {
                console.error('Authorization check failed:', error);
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
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple mx-auto mb-4" />
                    <p className="text-slate-600">Toegang controleren...</p>
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
