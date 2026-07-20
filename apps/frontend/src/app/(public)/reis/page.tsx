import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount, getCurrentUserProfileAction, getLatestPastTrip } from '@/server/actions/events/reis/reis-public.actions';
import { getDocumenten } from '@/server/actions/public/website.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { ReisTripSignup } from '@salvemundi/validations/schema/trip.zod';
import type { EnrichedUser } from '@/types/auth';
import { formatDate } from '@/shared/lib/utils/date';
import Image from 'next/image';
import { Lock, ShieldCheck, Mail, Info, ExternalLink } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';

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

    const showClosedLayout = !nextTrip || (!canSignUp && !userSignup);

    if (showClosedLayout) {
        const pastTrip = nextTrip ? null : await getLatestPastTrip();
        
        const isWaitingForDate = Boolean(
            nextTrip && 
            registrationStartDate && 
            now < registrationStartDate
        );

        const announcementTitle = isWaitingForDate ? "Binnenkort Open" : "Inschrijvingen Gesloten";
        const announcementMessage = nextTrip ? registrationStartText : reisDisabledMessage;
        
        const displayTrip = nextTrip || pastTrip;
        const displayTripImage = displayTrip?.image;
        const displayTripName = displayTrip?.name;
        const displayTripDescription = displayTrip?.description;
        const isPast = !nextTrip;

        return (
            <PublicPageShell>
                <h1 className="sr-only">Reis</h1>
                <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-24 lg:pb-32">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left Column: Announcement & Goed om te weten */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-8">
                            {/* Announcement card */}
                            <div className="bg-bg-card dark:border dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Lock className="h-32 w-32 text-theme-purple" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-theme-purple/5 text-theme-purple rounded-full flex items-center justify-center mb-6 border border-theme-purple/10">
                                        <Lock className="w-8 h-8 text-theme-purple" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-theme-purple mb-4">
                                        {announcementTitle}
                                    </h2>
                                    <p className="text-text-muted text-sm sm:text-base max-w-lg leading-relaxed font-semibold">
                                        {announcementMessage}
                                    </p>
                                </div>
                            </div>

                            {/* Goed om te weten card */}
                            <div className="bg-bg-card dark:border dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <ShieldCheck className="h-32 w-32 text-theme-purple" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl sm:text-2xl font-bold text-theme-purple mb-8 flex items-center gap-3">
                                        Goed om te weten
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {[
                                            { icon: <ShieldCheck className="h-5 w-5" />, title: 'Lidmaatschap', content: <>Je hoeft <strong>geen lid</strong> te zijn om mee te gaan.</> },
                                            { icon: <Mail className="h-5 w-5" />, title: 'Bevestiging', content: <>Je krijgt direct een mail na je inschrijving.</> },
                                            { icon: <Info className="h-5 w-5" />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
                                            { icon: <ExternalLink className="h-5 w-5" />, title: 'Vragen?', content: <>Mail ons op <a href="mailto:reis@salvemundi.nl" className="text-theme-purple font-bold hover:underline">reis@salvemundi.nl</a></> },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-theme-purple/5 text-theme-purple flex items-center justify-center shrink-0 border border-theme-purple/10 transition-colors group-hover:bg-theme-purple/10">
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold tracking-widest text-text-muted">{item.title}</p>
                                                    <div className="text-sm text-text-main font-medium leading-relaxed">
                                                        {item.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Trip Info */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-8">
                            {displayTrip && (
                                <div className="bg-bg-card dark:border dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                                    {displayTripImage && (
                                        <div className="relative w-full h-[250px] sm:h-[350px] overflow-hidden bg-slate-900/10">
                                            <Image
                                                src={getImageUrl(displayTripImage)}
                                                alt={displayTripName ?? 'Reis'}
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                    <div className="p-6 sm:p-10">
                                        <h3 className="text-xl sm:text-2xl font-bold text-theme-purple mb-6 flex items-center gap-3">
                                            {isPast 
                                                ? `Hoe was onze vorige Reis${displayTripName ? `: ${displayTripName}` : ''}?`
                                                : displayTripName || 'Over de Reis'
                                            }
                                        </h3>
                                        <div className="text-text-muted space-y-4 prose prose-sm sm:prose prose-purple dark:prose-invert max-w-none prose-p:leading-relaxed font-medium">
                                            {displayTripDescription ? (
                                                <SafeMarkdown content={displayTripDescription} />
                                            ) : (
                                                <p>
                                                    Elk jaar organiseert de Reiscommissie van SV Salve Mundi een geweldige reis naar een prachtige bestemming in Europa. Tijdens deze reizen bezoeken we cultuurrijke locaties, lokale brouwerijen, en organiseren we gezellige activiteiten zoals een pubcrawl door de stad. Houd onze pagina en socials in de gaten voor de bekendmaking van de volgende reis!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    return (
        <PublicPageShell>
            <h1 className="sr-only">Reis</h1>
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-24 lg:pb-32">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <ReisFormIsland
                        nextTrip={nextTrip}
                        userSignup={userSignup}
                        canSignUp={canSignUp}
                        registrationStartText={registrationStartText}
                        participantsCount={participantsCount}
                        initialUser={currentUserProfile}
                        termsFileUrl={termsFileUrl}
                    />
                    <ReisInfoIsland nextTrip={nextTrip} />
                </div>
            </div>
        </PublicPageShell>
    );
}
