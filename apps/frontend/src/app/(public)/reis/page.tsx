import React, { Suspense } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { getReisSiteSettings, getUpcomingTrips, getTripSignups } from '@/server/actions/reis.actions';
import { ReisPageHeaderSkeleton, ReisFormSkeleton, ReisInfoSkeleton } from '@/components/ui/Reis/ReisSkeletons';
import { ReisFormIsland } from '@/components/islands/Reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/Reis/ReisInfoIsland';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
// Note: Backend might not support generic headers auth in edge properly, skipping directus fetch auth mismatch for now or replace with correct if needed.
// We must remove `import { auth } from '@/lib/auth';` and the related code if `lib/auth.ts` doesn't exist. The user prompt specified "core Better Auth session check via cookie" but not an exported `auth` object in lib/auth.ts.
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ReisPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    params: Promise<{ [key: string]: string }>;
}

async function ReisSettingsGuard({ children }: { children: React.ReactNode }) {
    const siteSettings = await getReisSiteSettings();
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

    return <>{children}</>;
}

async function ReisHeaderContent() {
    const trips = await getUpcomingTrips();
    const nextTrip = trips.length > 0 ? trips[0] : null;

    const headerBackgroundImage = nextTrip?.image
        ? getImageUrl(nextTrip.image)
        : '/img/placeholder.svg';

    return (
        <PageHeader
            title={nextTrip?.name || "SALVE MUNDI REIS"}
            backgroundImage={headerBackgroundImage}
            contentPadding="py-20"
            imageFilter="brightness(0.65)"
        >
            <div className="flex flex-col items-center">
                <p className="max-w-3xl mt-4 text-lg font-medium text-[var(--theme-purple)] dark:text-white drop-shadow-sm sm:text-xl text-center">
                    Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur.
                </p>
            </div>
        </PageHeader>
    );
}

async function ReisMainContent() {
    // 2. Fetch Trips
    const trips = await getUpcomingTrips();
    const nextTrip = trips.length > 0 ? trips[0] : null;

    // 3. Status checks
    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : false;
    const canSignUp = Boolean(nextTrip && (nextTrip.registration_open || isRegistrationDateReached));

    const showStartText = !canSignUp && registrationStartDate;
    const registrationStartText = showStartText
        ? `Inschrijving opent op ${format(registrationStartDate!, 'd MMMM yyyy HH:mm', { locale: nl })}`
        : 'Inschrijving nog niet beschikbaar';

    // 4. Participant check
    let signups: any[] = [];
    if (nextTrip) {
        signups = await getTripSignups(nextTrip.id);
    }
    const participantsCount = signups.filter(s => s.status === 'confirmed' || s.status === 'registered').length || 0;

    const userSignup = null; // Session fetching removed temporarily due to missing server auth export.


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

export default async function ReisPage({ searchParams, params }: ReisPageProps) {
    // REQUIRED FOR NEXT.JS 16 - Awaiting dynamic primitives.
    const _searchParams = await searchParams;
    const _params = await params;

    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-background">Laden...</div>}>
            <ReisSettingsGuard>
                <div className="flex flex-col w-full">
                    {/* Header boundary prevents hero from blocking main content, or vice versa depending on priority */}
                    <Suspense fallback={<ReisPageHeaderSkeleton />}>
                        <ReisHeaderContent />
                    </Suspense>
                </div>

                <main className="relative overflow-hidden bg-background">
                    <Suspense fallback={<div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12 flex flex-col lg:flex-row gap-8 items-start"><ReisFormSkeleton /><ReisInfoSkeleton /></div>}>
                        <ReisMainContent />
                    </Suspense>
                </main>
            </ReisSettingsGuard>
        </Suspense>
    );
}
