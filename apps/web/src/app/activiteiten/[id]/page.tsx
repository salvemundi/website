import { getEventAction, getEventSignupStatusAction } from '@/shared/api/event-actions';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl } from '@/shared/lib/api/image';
import { sanitizeHtml } from '@/shared/lib/utils/sanitize';
import { isEventPast } from '@/shared/lib/utils/date';
import EventInteractionIsland from './EventInteractionIsland';
import AttendanceButton from '@/entities/activity/ui/AttendanceButton';
import {
    CalendarClock,
    Euro,
    Users as UsersIcon,
    Mail,
    Info,
    MapPin
} from 'lucide-react';

const buildCommitteeEmail = (name?: string | null) => {
    if (!name) return undefined;
    const normalized = name.toLowerCase();
    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';

    const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/commissie|committee/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch user and event in parallel
    const [event, user] = await Promise.all([
        getEventAction(id),
        getCurrentUserAction()
    ]);

    if (!event) {
        return (
            <div className="relative min-h-screen">
                <PageHeader
                    title="Activiteit niet gevonden"
                    backgroundImage="/img/backgrounds/Kroto2025.jpg"
                />
                <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-lg font-bold mb-4">De gevraagde activiteit kon niet worden gevonden.</p>
                        <a
                            href="/activiteiten"
                            className="inline-flex items-center gap-2 bg-theme-purple text-white font-bold py-2 px-4 rounded-xl"
                        >
                            Terug naar activiteiten
                        </a>
                    </div>
                </main>
            </div>
        );
    }

    // Check signup status if user is logged in
    let initialSignup = null;
    if (user) {
        initialSignup = await getEventSignupStatusAction(event.id, user.id);
    }

    // Server-computed dates & derived values
    const committeeEmail = event?.committee_name ? buildCommitteeEmail(event.committee_name) : undefined;
    const rawDate = event?.event_date;
    const isPast = isEventPast(rawDate);
    const isDeadlinePassed = event?.inschrijf_deadline ? new Date(event.inschrijf_deadline) < new Date() : false;

    let formattedDate = rawDate;
    if (rawDate) {
        const date = new Date(rawDate);
        if (!Number.isNaN(date.getTime())) {
            const formatOptions: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            };
            formattedDate = new Intl.DateTimeFormat('nl-NL', formatOptions).format(date);
            if (event.event_date_end && event.event_date_end !== event.event_date) {
                const endDate = new Date(event.event_date_end);
                if (!Number.isNaN(endDate.getTime())) {
                    formattedDate = `${formattedDate} t/m ${new Intl.DateTimeFormat('nl-NL', formatOptions).format(endDate)}`;
                }
            }
        }
    }

    let formattedStart = null;
    if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        formattedStart = `${hours}:${minutes}`;
    } else if (rawDate && (rawDate.includes('T') || /\d{2}:\d{2}/.test(rawDate))) {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) formattedStart = parsed.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    }

    let formattedEnd = null;
    const endRaw = event.event_time_end || event.time_end || event.end_time;
    if (endRaw) {
        const [hours, minutes] = endRaw.split(':');
        formattedEnd = `${hours}:${minutes}`;
    }

    const formattedTimeRange = formattedStart ? (formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart) : null;
    const formattedTime = formattedStart;

    const applicablePrice = user?.is_member ? Number(event.price_members) : Number(event.price_non_members);

    let displayPrice = 'Gratis';
    if (applicablePrice > 0) {
        displayPrice = `€${applicablePrice.toFixed(2).replace('.', ',')}`;
    }

    const headerFilter = isPast ? 'grayscale(100%) brightness(0.6) contrast(0.95)' : undefined;
    const descriptionToUse = event.description_logged_in || event.description;

    // We need login redirect URL
    const loginRedirectUrl = `/inloggen?returnTo=/activiteiten/${event.id}`;

    return (
        <>
            <PageHeader
                title={event.name}
                backgroundImage={event.image ? getImageUrl(event.image, { format: 'webp', width: 1200, quality: 80 }) : undefined}
                imageFilter={headerFilter}
            >
                <div className="flex flex-col items-center gap-2">
                    {isPast && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                            Afgelopen evenement
                        </div>
                    )}

                    {event.committee_name && (
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-0">
                                Georganiseerd door {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                            </p>
                            {event.only_members && (
                                <span className="bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                                    Leden Alleen
                                </span>
                            )}
                        </div>
                    )}
                    {user && (
                        <div>
                            <AttendanceButton eventId={event.id} userId={user.id} />
                        </div>
                    )}
                </div>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                    <EventInteractionIsland
                        event={event}
                        user={user}
                        initialSignup={initialSignup}
                        isPast={isPast}
                        isDeadlinePassed={isDeadlinePassed}
                        applicablePrice={applicablePrice}
                        displayPrice={displayPrice}
                        formattedDate={formattedDate}
                        loginRedirectUrl={loginRedirectUrl}
                    />

                    <div className="md:col-span-1 md:row-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                        <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Datum & Tijd</p>
                                <p className="text-base font-semibold text-theme-purple dark:text-theme-white truncate">{formattedDate}</p>
                                {(formattedTimeRange || formattedTime) && (
                                    <p className="text-sm text-theme-purple/80 dark:text-theme-white/80">{formattedTimeRange || formattedTime}</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                <Euro className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Prijs</p>
                                <p className="text-base font-semibold text-theme-purple dark:text-theme-white">{displayPrice}</p>
                            </div>
                        </div>

                        {event.location && (
                            <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Locatie</p>
                                    <p className="text-base font-semibold text-theme-purple dark:text-theme-white break-words max-w-[18rem]">{event.location}</p>
                                </div>
                            </div>
                        )}

                        {event.committee_name && (
                            <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                    <UsersIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Organisatie</p>
                                    <p className="text-base font-semibold text-theme-purple dark:text-theme-white truncate">
                                        {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {(event.contact_name || committeeEmail || event.contact) && (
                            <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Contact</p>
                                    {event.contact_name && (
                                        <p className="text-base font-semibold text-theme-purple dark:text-theme-white">{event.contact_name}</p>
                                    )}
                                    {committeeEmail && (
                                        <a href={`mailto:${committeeEmail}`} className="text-sm text-theme-purple/80 dark:text-theme-white/80 hover:underline break-all">
                                            {committeeEmail}
                                        </a>
                                    )}
                                    {event.contact && typeof event.contact === 'string' && event.contact.includes('@') && (
                                        <a href={`mailto:${event.contact}`} className="text-sm text-theme-purple/80 dark:text-theme-white/80 hover:underline break-all block mt-1">
                                            {event.contact}
                                        </a>
                                    )}
                                    {event.contact && typeof event.contact === 'string' && !event.contact.includes('@') && (
                                        <p className="text-sm text-theme-purple/80 dark:text-theme-white/80 break-all mt-1">{event.contact}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {descriptionToUse && (
                        <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg flex flex-col">
                            <h2 className="mb-4 text-2xl font-bold text-theme-purple dark:text-theme-white flex items-center gap-2">
                                <Info className="h-6 w-6 text-theme-purple dark:text-theme-white" />
                                Over dit evenement
                            </h2>
                            <div
                                className="prose dark:prose-invert max-w-none text-slate-600 dark:text-white/80"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(descriptionToUse) }}
                            />
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
