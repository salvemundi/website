'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount } from '@/server/actions/reis.actions';
import { ReisTrip, ReisSiteSettings, ReisTripSignup } from '@salvemundi/validations';
import { ReisPageHeaderSkeleton, ReisFormSkeleton, ReisInfoSkeleton } from '@/components/ui/activities/ReisSkeletons';
import { ReisFormIsland } from '@/components/islands/activities/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/activities/ReisInfoIsland';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ReisMainContentProps {
    trips: ReisTrip[];
    siteSettings: ReisSiteSettings | null;
    participantsCount: number;
    userSignup: ReisTripSignup | null;
    onRefresh: () => void;
}

function ReisMainContent({
    trips,
    siteSettings,
    participantsCount,
    userSignup,
    onRefresh
}: ReisMainContentProps) {
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
                        onRefresh={onRefresh}
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
    const [data, setData] = useState<{ 
        trips: ReisTrip[]; 
        settings: ReisSiteSettings | null; 
        participantsCount: number;
        userSignup: ReisTripSignup | null;
    } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        async function fetchData() {
            const [trips, settings] = await Promise.all([
                getUpcomingTrips(),
                getReisSiteSettings()
            ]);
            
            let participantsCount = 0;
            let userSignup: ReisTripSignup | null = null;
            
            if (trips.length > 0) {
                const tripId = trips[0].id;
                const [count, signup] = await Promise.all([
                    getTripParticipantsCount(tripId),
                    getUserTripSignup(tripId)
                ]);
                participantsCount = count;
                userSignup = signup;
            }
            setData({ trips, settings, participantsCount, userSignup });
        }
        fetchData();
    }, [refreshKey]);

    if (!data) return <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12 flex flex-col lg:flex-row gap-8 items-start"><ReisFormSkeleton /><ReisInfoSkeleton /></div>;

    return (
        <ReisMainContent 
            trips={data.trips} 
            siteSettings={data.settings} 
            participantsCount={data.participantsCount} 
            userSignup={data.userSignup}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
    );
}

// Static shell for the page
export default function ReisPage() {
    return (
        <>
            <div className="flex flex-col w-full">
                <Suspense fallback={<ReisPageHeaderSkeleton />}>
                    <PageHeader
                        title="SALVE MUNDI REIS"
                        backgroundImage="/img/newlogo.svg"
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
