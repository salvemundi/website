'use client';

import React, { useState } from 'react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations/schema/reis.zod';
import { authClient } from '@/lib/auth';
import { ReisSignupStatus } from './ReisSignupStatus';
import { ReisRegistrationForm } from './ReisRegistrationForm';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { revalidateReisAction } from '@/server/actions/reis.actions';

import { Skeleton } from '@/components/ui/Skeleton';

interface ReisFormIslandProps {
    isLoading?: boolean;
    isSignedUp?: boolean;
    isReisDisabled?: boolean;
    nextTrip: ReisTrip | null;
    userSignup: ReisTripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
    initialUser?: any;
}

export function ReisFormIsland({ 
    isLoading = false,
    isSignedUp = false,
    isReisDisabled = false,
    nextTrip, 
    userSignup, 
    canSignUp, 
    registrationStartText,
    initialUser 
}: ReisFormIslandProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    
    // We prioritize the server-provided user to avoid any flicker.
    // IMPORTANT: We REMOVE the sessionPending check here. 
    // The form should be in the HTML immediately for the browser to avoid autofill "shocks".
    const currentUser = initialUser || session?.user;
    
    // We only show loading if we don't have the trip data yet.
    const isReallyLoading = isLoading;
    
    const [refreshing, setRefreshing] = useState(false);

    if (isReallyLoading) {
        if (isReisDisabled) {
            return (
                <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-[var(--border-color)]/20 rounded-2xl sm:rounded-3xl shadow-lg p-8 animate-pulse text-center" aria-busy="true">
                    <Skeleton className="mx-auto h-8 w-1/3 bg-theme-purple/10 mb-4" rounded="lg" />
                    <Skeleton className="mx-auto h-4 w-3/4 bg-[var(--text-muted)]/10" rounded="full" />
                </section>
            );
        }

        if (isSignedUp) {
            return (
                <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-[var(--border-color)]/20 rounded-2xl sm:rounded-3xl shadow-lg p-8 animate-pulse" aria-busy="true">
                    <div className="flex justify-between items-center mb-10">
                        <Skeleton className="h-8 w-1/2 bg-theme-purple/10" rounded="lg" />
                        <Skeleton className="h-8 w-8 bg-theme-purple/5" rounded="md" />
                    </div>
                    <div className="bg-theme-purple/5 rounded-2xl p-6 mb-6">
                        <Skeleton className="h-6 w-1/3 bg-theme-purple/10 mb-4" rounded="md" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full bg-theme-purple/10" rounded="full" />
                            <Skeleton className="h-4 w-3/4 bg-theme-purple/10" rounded="full" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-full bg-theme-purple/20" rounded="xl" />
                </section>
            );
        }

        return (
            <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-[var(--border-color)]/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 animate-pulse" aria-busy="true">
                <Skeleton className="h-10 w-3/4 sm:w-1/2 bg-theme-purple/10 mb-8" rounded="lg" />
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-5 w-full bg-[var(--text-muted)]/10" rounded="md" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-1/4 bg-[var(--text-muted)]/10" rounded="full" />
                            <Skeleton className="h-12 w-full bg-[var(--bg-main)]/50" rounded="xl" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-1/4 bg-[var(--text-muted)]/10" rounded="full" />
                            <Skeleton className="h-12 w-full bg-[var(--bg-main)]/50" rounded="xl" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-1/4 bg-[var(--text-muted)]/10" rounded="full" />
                        <Skeleton className="h-12 w-full bg-[var(--bg-main)]/50" rounded="xl" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-1/4 bg-[var(--text-muted)]/10" rounded="full" />
                        <Skeleton className="h-12 w-full bg-[var(--bg-main)]/50" rounded="xl" />
                    </div>
                    <Skeleton className="h-14 w-full bg-theme-purple/20 rounded-xl mt-6" />
                </div>
            </section>
        );
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Force a server-side revalidation of the path
            await revalidateReisAction();

            // Re-fetch the session client-side to ensure no stale auth state
            await authClient.getSession();

            // Trigger the server component to re-render with fresh data
            router.refresh();
        } catch (error) {
            
        } finally {
            // Keep the spinner going for a moment to indicate activity
            setTimeout(() => setRefreshing(false), 800);
        }
    };

    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-[var(--border-color)]/20 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 relative">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple dark:text-theme-white">
                    Inschrijven voor de Reis
                </h1>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 text-[var(--text-muted)] hover:text-theme-purple transition-colors disabled:opacity-50"
                    title="Gegevens vernieuwen"
                >
                    <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {userSignup ? (
                <ReisSignupStatus
                    userSignup={userSignup}
                    nextTrip={nextTrip}
                    error={null}
                />
            ) : (
                <ReisRegistrationForm
                    nextTrip={nextTrip}
                    canSignUp={canSignUp}
                    registrationStartText={registrationStartText}
                    currentUser={currentUser}
                    onRefresh={handleRefresh}
                />
            )}
        </section>
    );
}
