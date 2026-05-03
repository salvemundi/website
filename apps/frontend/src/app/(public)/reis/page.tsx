import React, { Suspense } from 'react';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount } from '@/server/actions/reis.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getCurrentUserProfileAction } from '@/server/actions/reis.actions';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Reis | Salve Mundi',
    description: 'Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring.',
};

export default async function ReisPage() {
    await connection();
    return (
        <PublicPageShell>
            <h1 className="sr-only">Reis</h1>
            <Suspense fallback={<ReisSkeleton />}>
                <ReisContent />
            </Suspense>
        </PublicPageShell>
    );
}

function ReisSkeleton() {
    return (
        <div className="mx-auto max-w-app px-4 pt-8 pb-8 sm:py-10 md:py-12 animate-pulse">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-2/3 h-[600px] bg-[var(--bg-card)] rounded-[2rem]" />
                <div className="w-full lg:w-1/3 h-[400px] bg-[var(--bg-card)] rounded-[2rem]" />
            </div>
        </div>
    );
}

async function ReisContent() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [trips, siteSettings, session] = await Promise.all([
        getUpcomingTrips(),
        getReisSiteSettings(),
        auth.api.getSession({ headers: await headers() })
    ]);

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';
    const nextTrip = trips.length > 0 ? trips[0] : null;

    let participantsCount = 0;
    let userSignup = null;
    let currentUserProfile = null;

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

    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : true;
    const canSignUp = Boolean(isReisEnabled && nextTrip && nextTrip.registration_open && isRegistrationDateReached);

    const registrationStartText = !isReisEnabled 
        ? reisDisabledMessage 
        : (!nextTrip?.registration_open 
            ? 'De inschrijvingen voor deze reis zijn momenteel gesloten.'
            : (registrationStartDate && now < registrationStartDate
                ? `Inschrijving opent op ${format(registrationStartDate!, 'd MMMM yyyy HH:mm', { locale: nl })}`
                : 'Inschrijving tijdelijk niet beschikbaar'));

    return (
        <div className="mx-auto max-w-app px-4 pt-8 pb-8 sm:py-10 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <ReisFormIsland
                    nextTrip={nextTrip}
                    userSignup={userSignup}
                    canSignUp={canSignUp}
                    registrationStartText={registrationStartText}
                    participantsCount={participantsCount}
                    initialUser={currentUserProfile}
                />
                <ReisInfoIsland nextTrip={nextTrip} />
            </div>
        </div>
    );
}
