'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { getReisSiteSettings, getUpcomingTrips, getTripSignups } from '@/server/actions/reis.actions';
import { ReisTrip, ReisSiteSettings, ReisTripSignup } from '@salvemundi/validations';
import { ReisPageHeaderSkeleton, ReisFormSkeleton, ReisInfoSkeleton } from '@/components/ui/Reis/ReisSkeletons';
import { ReisFormIsland } from '@/components/islands/Reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/Reis/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

function ReisMainContent({
    trips,
    siteSettings,
    signups
}: {
    trips: ReisTrip[],
    siteSettings: ReisSiteSettings | null,
    signups: ReisTripSignup[]
}) {
    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';

    if (!isReisEnabled) {
        return (
            <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
                <div className="max-w-4xl mx-auto bg-surface dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-card dark:shadow-card-elevated">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-4">Reis momenteel niet beschikbaar</h2>
                    <p className="text-base lg:text-lg text-theme-text-muted mb-6">{reisDisabledMessage}</p>
                    <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-theme text-white font-semibold rounded-full shadow-lg shadow-theme-purple/30 hover:-translate-y-0.5 transition-all">
                        Terug naar Home
                    </Link>
                </div>
            </section>
        );
    }

    const nextTrip = trips.length > 0 ? trips[0] : null;

    // IMPORTANT: Date logic now runs on client, resolving prerender issues
    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : false;
    const canSignUp = Boolean(nextTrip && (nextTrip.registration_open || isRegistrationDateReached));

    const showStartText = !canSignUp && registrationStartDate;
    const registrationStartText = showStartText
        ? `Inschrijving opent op ${format(registrationStartDate!, 'd MMMM yyyy HH:mm', { locale: nl })}`
        : 'Inschrijving nog niet beschikbaar';

    const participantsCount = signups.filter(s => s.status === 'confirmed' || s.status === 'registered').length || 0;
    const userSignup = null;

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <Suspense fallback={<ReisFormSkeleton />}>
                    <ReisFormIsland
                        nextTrip={nextTrip}
                        userSignup={userSignup}
                        canSignUp={canSignUp}
                        registrationStartText={registrationStartText}
                        participantsCount={participantsCount}
                    />
                </Suspense>

                <Suspense fallback={<ReisInfoSkeleton />}>
                    <ReisInfoIsland nextTrip={nextTrip} />
                </Suspense>
            </div>
        </div>
    );
}

// Client-side data fetching wrapper to satisfy prerenderer
function ReisPageDataWrapper() {
    const [data, setData] = useState<{ trips: ReisTrip[]; settings: ReisSiteSettings | null; signups: ReisTripSignup[] } | null>(null);

    useEffect(() => {
        async function fetchData() {
            const [trips, settings] = await Promise.all([
                getUpcomingTrips(),
                getReisSiteSettings()
            ]);
            let signups: ReisTripSignup[] = [];
            if (trips.length > 0) {
                signups = await getTripSignups(trips[0].id);
            }
            setData({ trips, settings, signups });
        }
        fetchData();
    }, []);

    if (!data) return <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12 flex flex-col lg:flex-row gap-8 items-start"><ReisFormSkeleton /><ReisInfoSkeleton /></div>;

    return <ReisMainContent trips={data.trips} siteSettings={data.settings} signups={data.signups} />;
}

// Static shell for the page
export default function ReisPage() {
    return (
        <>
            <div className="flex flex-col w-full">
                <Suspense fallback={<ReisPageHeaderSkeleton />}>
                    {/* Header can still be server-action based if it doesn't use Date/auth, 
                        but for safety we'll just use a static-ish header or move it to client if needed. 
                        Let's keep it simple for now. */}
                    <PageHeader
                        title="SALVE MUNDI REIS"
                        backgroundImage="/img/placeholder.svg"
                        contentPadding="py-20"
                        imageFilter="brightness(0.65)"
                    >
                        <div className="flex flex-col items-center">
                            <p className="max-w-3xl mt-4 text-lg font-medium text-[var(--theme-purple)] dark:text-white drop-shadow-sm sm:text-xl text-center">
                                Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur.
                            </p>
                        </div>
                    </PageHeader>
                </Suspense>
            </div>

            <main className="relative overflow-hidden bg-background">
                <ReisPageDataWrapper />
            </main>
        </>
    );
}
