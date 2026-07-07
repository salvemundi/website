'use client';

import { useState } from 'react';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations/schema/trip.zod';
import { authClient } from '@/lib/auth';
import { ReisSignupStatus } from './ReisSignupStatus';
import { ReisRegistrationForm } from './ReisRegistrationForm';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { revalidateReisAction } from '@/server/actions/events/reis/reis-public.actions';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

interface ReisFormIslandProps {
    isSignedUp?: boolean;
    isReisDisabled?: boolean;
    nextTrip: ReisTrip | null;
    userSignup: ReisTripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
    initialUser?: EnrichedUser | null;
    termsFileUrl?: string | null;
}

export function ReisFormIsland({
    nextTrip,
    userSignup,
    canSignUp,
    registrationStartText,
    initialUser,
    termsFileUrl
}: ReisFormIslandProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const currentUser = (initialUser || session?.user || null) as EnrichedUser | null;

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await revalidateReisAction();
            await authClient.getSession();
            router.refresh();
        } catch (error) {
            safeConsoleError('[ReisFormIsland.tsx][ReisFormIsland] ', error);
        } finally {
            setTimeout(() => setRefreshing(false), 800);
        }
    };

    return (
        <StandardFormCard
            title={nextTrip?.name || 'Inschrijven'}
            className="w-full lg:w-1/2"
            headerActions={
                <button
                    onClick={() => { void handleRefresh(); }}
                    disabled={refreshing}
                    className="p-3 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl text-(--text-muted) hover:text-purple-500 transition-all disabled:opacity-50 active:scale-90"
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
                        onRefresh={() => { void handleRefresh(); }}
                        termsFileUrl={termsFileUrl}
                    />
                )}
            </div>
        </StandardFormCard>
    );
}