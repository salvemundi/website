import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount, getCurrentUserProfileAction } from '@/server/actions/events/trip.actions';
import { getDocumenten } from '@/server/actions/public/website.actions';
import { TripFormIsland } from '@/components/islands/reis/TripFormIsland';
import { TripInfoIsland } from '@/components/islands/reis/TripInfoIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { ReisTripSignup } from '@salvemundi/validations/schema/trip.zod';
import type { EnrichedUser } from '@/types/auth';
import { formatDate } from '@/shared/lib/utils/date';

export const metadata = {
    title: 'Reis | Salve Mundi',
    description: 'Schrijf je in voor een reis van Salve Mundi!'
};

export default async function ReisPage() {
    await connection();

    const [trips, siteSettings, session, documents] = await Promise.all([
        getUpcomingTrips(),
        getReisSiteSettings(),
        getEnrichedSession(),
        getDocumenten()
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
                    ? `Inschrijving opent op ${formatDate(registrationStartDate, 'd MMMM yyyy HH:mm')}`
                    : 'De inschrijvingen voor deze reis zijn momenteel gesloten.')
                : 'Inschrijving geopend!'));

    const reisvoorwaardenDoc = documents.find(
        doc => doc.category?.toLowerCase() === 'reis' || 
               doc.title.toLowerCase().includes('reisvoorwaarde') ||
               doc.title.toLowerCase().includes('reisvoorwaarden')
    );
    const termsFileUrl = reisvoorwaardenDoc?.file ? `/api/assets/${reisvoorwaardenDoc.file}` : null;

    return (
        <PublicPageShell>
            <h1 className="sr-only">Reis</h1>
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-24 lg:pb-32">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <TripFormIsland
                        nextTrip={nextTrip}
                        userSignup={userSignup}
                        canSignUp={canSignUp}
                        registrationStartText={registrationStartText}
                        participantsCount={participantsCount}
                        initialUser={currentUserProfile}
                        termsFileUrl={termsFileUrl}
                    />
                    <TripInfoIsland nextTrip={nextTrip} />
                </div>
            </div>
        </PublicPageShell>
    );
}
