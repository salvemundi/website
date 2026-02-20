import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl } from '@/shared/lib/api/image';
import { getTripsAction, getSiteSettingsAction, getMyTripSignupAction, getTripParticipantsCountAction } from '@/shared/api/data-actions';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { sanitizeHtml } from '@/shared/lib/utils/sanitize';
import { Calendar } from 'lucide-react';
import ReisRegistrationForm from '@/widgets/reis/ReisRegistrationForm';
import ReisStatusCard from '@/widgets/reis/ReisStatusCard';

export const dynamic = 'force-dynamic';

export default async function ReisPage() {
    // 1. Fetch Data in Parallel
    const [currentUser, siteSettings, trips] = await Promise.all([
        getCurrentUserAction(),
        getSiteSettingsAction('reis'),
        getTripsAction()
    ]);

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';

    // 2. Determine Next Trip
    let nextTrip = null;
    if (trips && trips.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validTrips = trips.filter((trip) => {
            // If it has an end_date, use that to check if the trip is still relevant
            if (trip.end_date) {
                const endDate = new Date(trip.end_date);
                endDate.setHours(23, 59, 59, 999);
                return endDate >= today;
            }

            // Otherwise use event_date (start date)
            const dateStr = trip.event_date || trip.start_date;
            if (!dateStr) return false;
            const eventDate = new Date(dateStr);
            eventDate.setHours(23, 59, 59, 999); // Even if it started today, it's still valid
            return eventDate >= today;
        });

        if (validTrips.length > 0) {
            validTrips.sort((a, b) => {
                const dateA = new Date((a.event_date || a.start_date)!);
                const dateB = new Date((b.event_date || b.start_date)!);
                return dateA.getTime() - dateB.getTime();
            });
            nextTrip = validTrips[0];
        }
    }

    // 3. Fetch Trip Specific Data (if trip exists)
    // let participantsCount = 0;
    let userSignup = null;

    if (nextTrip) {
        // Parallel fetch for trip specific details
        const results = await Promise.all([
            getTripParticipantsCountAction(nextTrip.id),
            currentUser ? getMyTripSignupAction(nextTrip.id) : Promise.resolve(null)
        ]);
        // participantsCount = results[0];
        userSignup = results[1];
    }

    // 4. Prepare Display Logic
    const headerBackgroundImage = nextTrip?.image
        ? getImageUrl(nextTrip.image)
        : '/img/placeholder.svg';

    const nextTripStartDate = nextTrip?.start_date
        ? new Date(nextTrip.start_date)
        : nextTrip?.event_date
            ? new Date(nextTrip.event_date)
            : null;

    const nextTripEndDate = nextTrip?.end_date
        ? new Date(nextTrip.end_date)
        : nextTrip?.event_date
            ? new Date(nextTrip.event_date)
            : null;

    const formattedFromDate =
        nextTripStartDate && !isNaN(nextTripStartDate.getTime())
            ? format(nextTripStartDate, 'd MMMM yyyy', { locale: nl })
            : null;

    const formattedUntilDate =
        nextTripEndDate && !isNaN(nextTripEndDate.getTime())
            ? format(nextTripEndDate, 'd MMMM yyyy', { locale: nl })
            : null;

    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : false;
    const canSignUp = Boolean(nextTrip && (nextTrip.registration_open || isRegistrationDateReached));

    const showStartText = !canSignUp && registrationStartDate;
    const registrationStartText = showStartText && registrationStartDate
        ? `Inschrijving opent op ${format(registrationStartDate, 'd MMMM yyyy HH:mm', { locale: nl })}`
        : 'Inschrijving nog niet beschikbaar';


    // 5. Render
    if (!isReisEnabled) {
        return (
            <main className="min-h-screen bg-background">
                <PageHeader
                    title="SALVE MUNDI REIS"
                    backgroundImage="/img/placeholder.svg"
                    variant="centered"
                />
                <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
                    <div className="max-w-4xl mx-auto bg-surface dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-card dark:shadow-card-elevated">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-4">Reis momenteel niet beschikbaar</h2>
                        <p className="text-base lg:text-lg text-theme-text-muted mb-6">{reisDisabledMessage}</p>
                        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-theme text-white font-semibold rounded-full shadow-lg shadow-theme-purple/30 hover:-translate-y-0.5 transition-all">
                            Terug naar Home
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title={nextTrip?.name || "SALVE MUNDI REIS"}
                    backgroundImage={headerBackgroundImage}
                    variant="centered"
                    titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-6xl drop-shadow-sm"
                    description={
                        <p className="mx-auto text-center text-lg sm:text-xl text-white/90 max-w-3xl mt-4 font-medium drop-shadow-sm">
                            Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur.
                        </p>
                    }
                />
            </div>

            <main className="relative overflow-hidden bg-background">
                <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">

                        {/* Left Column: Form or Status card */}
                        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6">
                                Inschrijven voor de Reis
                            </h1>

                            {userSignup && nextTrip ? (
                                <ReisStatusCard
                                    signup={{
                                        id: userSignup.id,
                                        status: userSignup.status,
                                        deposit_paid: userSignup.deposit_paid,
                                        full_payment_paid: userSignup.full_payment_paid
                                    }}
                                    trip={{
                                        id: nextTrip.id,
                                        name: nextTrip.name,
                                        allow_final_payments: nextTrip.allow_final_payments,
                                        end_date: nextTrip.end_date
                                    }}
                                />
                            ) : nextTrip ? (
                                canSignUp ? (
                                    <ReisRegistrationForm trip={nextTrip} currentUser={currentUser} />
                                ) : (
                                    <div className="bg-white/20 text-white px-4 py-3 rounded">
                                        <p>{registrationStartText}</p>
                                    </div>
                                )
                            ) : (
                                <div className="bg-white/20 text-white px-4 py-3 rounded">
                                    Momenteel is er geen reis gepland. Houd deze pagina in de gaten voor nieuwe data!
                                </div>
                            )}

                        </section>

                        {/* Right Column: Info */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-8">
                            {/* Image + Date Card */}
                            {nextTrip && (
                                <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card">
                                    {nextTrip.image && (
                                        <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden group relative">
                                            <img
                                                src={getImageUrl(nextTrip.image)}
                                                alt={nextTrip.name}
                                                className="w-full max-h-64 sm:max-h-80 md:max-h-96 h-auto object-contain rounded-xl sm:rounded-2xl"
                                            />
                                        </div>
                                    )}
                                    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-theme-white-soft dark:bg-white/5 rounded-xl sm:rounded-2xl border border-theme-purple/10 dark:border-white/5">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-theme-purple/10 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-theme-purple" />
                                            </div>
                                            <div>
                                                <p className="text-theme-text-muted text-xs font-semibold uppercase tracking-wider">Datum Reis</p>
                                                <p className="text-base sm:text-lg md:text-xl font-bold text-theme-purple dark:text-theme-white mt-0.5 break-words">
                                                    {formattedFromDate && formattedUntilDate ? (
                                                        formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} — ${formattedUntilDate}`
                                                    ) : (
                                                        'Nog te bepalen'
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {nextTrip?.description && (
                                <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
                                    <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6 flex items-center gap-2">
                                        <span>✈️</span> Over de Reis
                                    </h2>
                                    <div
                                        className="text-theme-text-muted dark:text-theme-text-muted space-y-4 prose prose-sm sm:prose prose-purple dark:prose-invert max-w-none prose-p:leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(nextTrip.description) }}
                                    />
                                </div>
                            )}

                            {/* Important Info */}
                            <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
                                <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6 flex items-center gap-2">
                                    <span>ℹ️</span> Belangrijke Informatie
                                </h2>
                                <ul className="space-y-3 sm:space-y-4">
                                    {[
                                        { icon: '👥', text: 'Je hoeft <strong>geen lid</strong> te zijn om deel te nemen' },
                                        { icon: '📧', text: 'Je ontvangt een bevestigingsmail na inschrijving' },
                                        { icon: '🔞', text: 'Minimumleeftijd: 18 jaar' },
                                        { icon: '🪪', text: 'Gebruik je volledige naam zoals op je paspoort/ID' },
                                        { icon: '📞', text: 'Bij vragen? Neem contact op via <a href="mailto:reis@salvemundi.nl" class="text-theme-purple underline font-semibold">reis@salvemundi.nl</a>' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 sm:gap-4">
                                            <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
                                            <span className="text-sm sm:text-base text-theme-text-muted leading-snug" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
