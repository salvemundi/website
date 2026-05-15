'use client';

import React, { useState } from 'react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations/schema/reis.zod';
import { authClient } from '@/lib/auth';
import { ReisSignupStatus } from './ReisSignupStatus';
import { ReisRegistrationForm } from './ReisRegistrationForm';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { revalidateReisAction } from '@/server/actions/events/reis.actions';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

import { type EnrichedUser } from '@/types/auth';

interface ReisFormIslandProps {
    isSignedUp?: boolean;
    isReisDisabled?: boolean;
    nextTrip: ReisTrip | null;
    userSignup: ReisTripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
    initialUser?: EnrichedUser | null;
}

export function ReisFormIsland({
    nextTrip,
    userSignup,
    canSignUp,
    registrationStartText,
    initialUser
}: ReisFormIslandProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    // We prioritize the server-provided user to avoid any flicker.
    const currentUser = (initialUser || session?.user || null) as EnrichedUser | null;

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Force a server-side revalidation of the path
            await revalidateReisAction();

            // Re-fetch the session client-side to ensure no stale auth state
            await authClient.getSession();

            // Trigger the server component to re-render with fresh data
            router.refresh();
        } catch (_error) {
            // Silently fail on background refresh
        } finally {
            // Keep the spinner going for a moment to indicate activity
            setTimeout(() => setRefreshing(false), 800);
        }
    };

    return (
        <StandardFormCard
            title={nextTrip?.name || 'Inschrijven'}
            subtitle="Jaarlijkse Reis"
            className="w-full lg:w-1/2"
            headerActions={
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-3 bg-theme-purple/5 hover:bg-theme-purple/10 rounded-2xl text-[var(--text-muted)] hover:text-theme-purple transition-all disabled:opacity-50 active:scale-90"
                    title="Gegevens vernieuwen"
                >
                    <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            }
        >
            <div className="duration-700">
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
            </div>
        </StandardFormCard>
    );
}
