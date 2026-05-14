import React from 'react';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount, getCurrentUserProfileAction } from '@/server/actions/events/reis.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { ReisTripSignup } from '@salvemundi/validations/schema/reis.zod';
import type { EnrichedUser } from '@/types/auth';

export const metadata = {
    title: 'Reis | Salve Mundi',
    description: 'Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring.'
};

export default async function ReisPage() {
    await connection();

    const [trips, siteSettings, session] = await Promise.all([
        getUpcomingTrips(),
        getReisSiteSettings(),
        getEnrichedSession()
    ]);

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';
    const nextTrip = trips.length > 0 ? trips[0] : null;

    let participantsCount = 0;
    let userSignup: ReisTripSignup | null = null;
    let currentUserProfile: EnrichedUser | null = null;

    if (nextTrip) {
        const [count, signup, profileResult] = await Promise.all([
            getTripParticipantsCount(nextTrip.id),
            getUserTripSignup(nextTrip.id),
            session?.user ? getCurrentUserProfileAction() : Promise.resolve(null)
        ]);

        participantsCount = count;
        userSignup = signup;

        if (profileResult && 'success' in profileResult && profileResult.success && profileResult.data) {
            currentUserProfile = profileResult.data as unknown as EnrichedUser;
        } else {
            currentUserProfile = session?.user ?? null;
        }
    }

    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();

    const registrationDateReached = Boolean(registrationStartDate && now >= registrationStartDate);

    const canSignUp = Boolean(
        isReisEnabled &&
        nextTrip &&
        !nextTrip.allow_final_payments &&
        (nextTrip.registration_open || registrationDateReached)
    );

    const registrationStartText = !isReisEnabled
        ? reisDisabledMessage
        : (nextTrip?.allow_final_payments
            ? 'De inschrijvingen zijn gesloten omdat de betalingsfase is begonnen.'
            : (!canSignUp
                ? (registrationStartDate && now < registrationStartDate
                    ? `Inschrijving opent op ${format(registrationStartDate, 'd MMMM yyyy HH:mm', { locale: nl })}`
                    : 'De inschrijvingen voor deze reis zijn momenteel gesloten.')
                : 'Inschrijving geopend!'));

    return (
        <PublicPageShell>
            <h1 className="sr-only">Reis</h1>
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
        </PublicPageShell>
    );
}