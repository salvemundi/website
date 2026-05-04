import React from 'react';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount, getCurrentUserProfileAction } from '@/server/actions/reis.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Reis | Salve Mundi',
    description: 'Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring.',
};

/**
 * ReisPage: Pure Nuclear SSR implementation.
 * No Suspense, no skeletons. All data is fetched on the server side
 * before any HTML is sent to the client to ensure a fast, flicker-free experience.
 */
export default async function ReisPage() {
    await connection();
    
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
    
    // registrationDateReached is true if a date was set and we passed it.
    const registrationDateReached = Boolean(registrationStartDate && now >= registrationStartDate);
    
    // canSignUp is true if the feature flag is on AND EITHER (manual toggle is on) OR (date has been reached)
    const canSignUp = Boolean(isReisEnabled && nextTrip && (nextTrip.registration_open || registrationDateReached));

    const registrationStartText = !isReisEnabled 
        ? reisDisabledMessage 
        : (!canSignUp
            ? (registrationStartDate && now < registrationStartDate
                ? `Inschrijving opent op ${format(registrationStartDate!, 'd MMMM yyyy HH:mm', { locale: nl })}`
                : 'De inschrijvingen voor deze reis zijn momenteel gesloten.')
            : 'Inschrijving geopend!');

    return (
        <PublicPageShell>
            <h1 className="sr-only">Reis</h1>
            <div className="mx-auto max-w-app px-4 pt-8 pb-8 sm:py-10 md:py-12 animate-in fade-in duration-700">
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
        </PublicPageShell>
    );
}
