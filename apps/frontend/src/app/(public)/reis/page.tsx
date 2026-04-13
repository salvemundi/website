import React, { Suspense } from 'react';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount } from '@/server/actions/reis.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getCurrentUserProfileAction } from '@/server/actions/reis.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Reis | Salve Mundi',
    description: 'Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring.',
};

async function ReisDataLoader() {
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

    const session = await auth.api.getSession({ headers: await headers() });
    
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
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
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
    );
}

export default async function ReisPage() {
    return (
        <PublicPageShell
            title="SALVE MUNDI REIS"
            description="Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur."
            backgroundImage="/img/backgrounds/reis-banner.jpg" 
            fallback={
                <div className="flex flex-col lg:flex-row gap-8 items-start animate-pulse">
                    <div className="w-full lg:w-3/5 h-[500px] bg-[var(--bg-card)] rounded-3xl skeleton-active" />
                    <div className="w-full lg:w-2/5 h-[400px] bg-[var(--bg-card)] rounded-3xl skeleton-active" />
                </div>
            }
        >
            <main className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                <ReisDataLoader />
            </main>
        </PublicPageShell>
    );
}

// In the main component, update ReisHeader usage
// (This is a simplified version, as PageHeader already handles its own internal skeleton if isLoading is passed)
