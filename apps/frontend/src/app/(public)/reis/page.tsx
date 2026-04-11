import React, { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount } from '@/server/actions/reis.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image-utils';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getCurrentUserProfileAction } from '@/server/actions/reis.actions';

export const dynamic = 'force-dynamic';

export default async function ReisPage() {
    // 1. Fetch data on the server
    const [trips, siteSettings] = await Promise.all([
        getUpcomingTrips(),
        getReisSiteSettings()
    ]);

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';
    const nextTrip = trips.length > 0 ? trips[0] : null;

    let participantsCount = 0;
    let userSignup = null;
    let currentUserProfile = null;

    // 2. Fetch User & Signup status
    const sessionHeaders = await headers();
    const session = await auth.api.getSession({ headers: sessionHeaders });
    
    if (nextTrip) {
        const promises: [Promise<number>, Promise<any>, Promise<any>?] = [
            getTripParticipantsCount(nextTrip.id),
            getUserTripSignup(nextTrip.id)
        ];

        if (session?.user) {
            promises.push(getCurrentUserProfileAction());
        }

        const [count, signup, profileResult] = await Promise.all(promises);
        
        participantsCount = count;
        userSignup = signup;
        currentUserProfile = profileResult?.success ? profileResult.data : session?.user;
    }

    // 2. Logic for registration availability (Calculated on Server)
    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();
    
    // Default to true if no date is set, so the toggle works immediately
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : true;
    
    // canSignUp is true ONLY if the global switch (isReisEnabled), the trip switch (registration_open), 
    // AND the start date are ALL satisfied.
    const canSignUp = Boolean(isReisEnabled && nextTrip && nextTrip.registration_open && isRegistrationDateReached);

    const registrationStartText = !isReisEnabled 
        ? reisDisabledMessage 
        : (!nextTrip?.registration_open 
            ? 'De inschrijvingen voor deze reis zijn momenteel gesloten.'
            : (registrationStartDate && now < registrationStartDate
                ? `Inschrijving opent op ${format(registrationStartDate!, 'd MMMM yyyy HH:mm', { locale: nl })}`
                : 'Inschrijving tijdelijk niet beschikbaar'));

    return (
        <>
            <ReisHeader tripImage={nextTrip?.image} />
            <main className="relative overflow-hidden bg-background">
                <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <Suspense fallback={
                            <ReisFormIsland 
                                isLoading 
                                isSignedUp={!!userSignup}
                                isReisDisabled={!isReisEnabled}
                                nextTrip={null} 
                                userSignup={null} 
                                canSignUp={false} 
                                registrationStartText="" 
                                participantsCount={0} 
                            />
                        }>
                            <ReisFormIsland
                                nextTrip={nextTrip}
                                userSignup={userSignup}
                                canSignUp={canSignUp}
                                registrationStartText={registrationStartText}
                                participantsCount={participantsCount}
                                initialUser={currentUserProfile}
                            />
                        </Suspense>

                        <Suspense fallback={<ReisInfoIsland isLoading nextTrip={null} />}>
                            <ReisInfoIsland nextTrip={nextTrip} />
                        </Suspense>
                    </div>
                </div>
            </main>
        </>
    );
}

function ReisHeader({ tripImage, isLoading = false }: { tripImage?: string | null; isLoading?: boolean }) {
    return (
        <div className="flex flex-col w-full">
            <PageHeader
                title="SALVE MUNDI REIS"
                backgroundImage={getImageUrl(tripImage)}
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
                isLoading={isLoading}
            >
                {!isLoading && (
                    <div className="flex flex-col items-center">
                        <p className="max-w-3xl mt-4 text-lg font-medium text-[var(--theme-purple)] dark:text-white drop-shadow-sm sm:text-xl text-center">
                            Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur.
                        </p>
                    </div>
                )}
            </PageHeader>
        </div>
    );
}

// In the main component, update ReisHeader usage
// (This is a simplified version, as PageHeader already handles its own internal skeleton if isLoading is passed)
