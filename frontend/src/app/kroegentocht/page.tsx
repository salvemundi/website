'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { pubCrawlSignupsApi, getImageUrl } from '@/shared/lib/api/salvemundi';

import { useSalvemundiPubCrawlEvents, useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

const ASSOCIATIONS = [
    'Salve Mundi',
    'Proxy',
    'Prick',
    'Young Financials',
    'Glow',
    'Socialis',
    'Topsy',
    'Watoto',
    'Bge',
    'Fact',
    'Fpsa',
    'Averroes',
    'Paramedisch',
    'Planck',
    'Pac',
    'Anders'
];

interface Participant {
    name: string;
    initial: string;
}

export default function KroegentochtPage() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        association: '',
        customAssociation: '',
        amount_tickets: 1,
    });
    const [participants, setParticipants] = useState<Participant[]>([{ name: '', initial: '' }]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: pubCrawlEvents, isLoading: eventsLoading } = useSalvemundiPubCrawlEvents();
    const { data: siteSettings, isLoading: isSettingsLoading } = useSalvemundiSiteSettings('kroegentocht');

    const isKroegentochtEnabled = siteSettings?.show ?? true;
    const kroegentochtDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de kroegentocht zijn momenteel gesloten.';

    const nextEvent = useMemo(() => {
        if (!pubCrawlEvents || pubCrawlEvents.length === 0) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validEvents = pubCrawlEvents.filter((event: any) => {
            if (!event.date) return false;
            const parsed = new Date(event.date);
            if (isNaN(parsed.getTime())) return false;

            const normalized = new Date(parsed);
            normalized.setHours(0, 0, 0, 0);
            return normalized.getTime() >= today.getTime();
        });

        if (validEvents.length === 0) return null;

        validEvents.sort((a: any, b: any) => {
            const dateA = new Date(a.date!);
            const dateB = new Date(b.date!);
            return dateA.getTime() - dateB.getTime();
        });

        return validEvents[0];
    }, [pubCrawlEvents]);

    const nextEventDate = nextEvent?.date ? new Date(nextEvent.date) : null;
    const formattedNextEventDate =
        nextEventDate && !isNaN(nextEventDate.getTime())
            ? format(nextEventDate, 'd MMMM yyyy')
            : null;
    const canSignUp = Boolean(nextEvent);
    const headerBackgroundImage = nextEvent?.image
        ? getImageUrl(nextEvent.image)
        : '/img/placeholder.svg';

    const [modalOpen, setModalOpen] = useState(false);
    const [modalSrc, setModalSrc] = useState<string | null>(null);

    const openImageModal = (src: string) => {
        setModalSrc(src);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalSrc(null);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'amount_tickets') {
            const parsed = parseInt(value, 10);
            const clamped = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
            setForm({ ...form, amount_tickets: clamped });

            // Update participants array based on ticket count
            const newParticipants = Array.from({ length: clamped }, (_, i) =>
                participants[i] || { name: '', initial: '' }
            );
            setParticipants(newParticipants);
            return;
        }
        setForm({ ...form, [name]: value });
    };

    const handleParticipantChange = (index: number, field: 'name' | 'initial', value: string) => {
        const newParticipants = [...participants];
        if (field === 'initial') {
            // Limit initial to single character
            newParticipants[index][field] = value.slice(0, 1).toUpperCase();
        } else {
            newParticipants[index][field] = value;
        }
        setParticipants(newParticipants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nextEvent) {
            setError('Er is momenteel geen kroegentocht beschikbaar om voor in te schrijven.');
            return;
        }

        // Validate all participants have name and initial
        const invalidParticipants = participants.some(p => !p.name.trim() || !p.initial.trim());
        if (invalidParticipants) {
            setError('Vul voor alle tickets een naam en eerste letter achternaam in.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Determine final association value
            const finalAssociation = form.association === 'Anders'
                ? form.customAssociation
                : form.association;

            // Format name_initials as JSON array string
            const nameInitials = JSON.stringify(participants.map(p => ({
                name: p.name,
                initial: p.initial
            })));



            // Create signup with status 'open' (just like standard activity signups)
            const signup = await pubCrawlSignupsApi.create({
                name: form.name,
                email: form.email,
                association: finalAssociation,
                amount_tickets: form.amount_tickets,
                pub_crawl_event_id: nextEvent.id,
                name_initials: nameInitials,
                payment_status: 'open',
            });

            if (!signup || !signup.id) {
                throw new Error('Kon inschrijving niet aanmaken.');
            }

            const totalPrice = (form.amount_tickets * 1).toFixed(2); // 1 euro per ticket
            const traceId = Math.random().toString(36).substring(7);

            const paymentPayload = {
                amount: totalPrice,
                description: `Kroegentocht Tickets - ${form.amount_tickets}x`,
                redirectUrl: window.location.origin + `/kroegentocht/bevestiging?id=${signup.id}`,
                registrationId: signup.id,
                registrationType: 'pub_crawl_signup', // Tell backend which collection to update
                email: form.email,
                firstName: form.name.split(' ')[0],
                lastName: form.name.split(' ').slice(1).join(' '),
                isContribution: false
            };

            const paymentRes = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-Id': traceId
                },
                body: JSON.stringify(paymentPayload),
            });

            if (!paymentRes.ok) {
                const errorData = await paymentRes.json();
                console.error(`[Payment][${traceId}] Payment Creation Failed:`, errorData);
                throw new Error(`${errorData.details || errorData.error || 'Fout bij het aanmaken van de betaling.'} (Target: ${errorData.target || 'unknown'})`);
            }

            const paymentData = await paymentRes.json();
            if (paymentData.checkoutUrl) {
                window.location.href = paymentData.checkoutUrl;
                return;
            }

            setSubmitted(true);
        } catch (err: any) {
            console.error('Error submitting kroegentocht signup:', err);
            let friendlyMessage = 'Er is een fout opgetreden bij het inschrijven. Probeer het opnieuw.';
            const isProd = process.env.NODE_ENV === 'production';

            if (err?.message?.includes('RECORD_NOT_UNIQUE')) {
                friendlyMessage = 'Dit e-mailadres staat al geregistreerd voor deze kroegentocht. Gebruik een ander e-mailadres.';
            } else if (err?.message) {
                friendlyMessage = isProd ? friendlyMessage : `Fout: ${err.message}`;
            }

            setError(friendlyMessage);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title="KROEGENTOCHT"
                    backgroundImage={headerBackgroundImage}
                />
            </div>

            <main className="relative overflow-hidden bg-white dark:bg-gray-900">
                {!isKroegentochtEnabled ? (
                    <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
                        <div className="max-w-4xl mx-auto bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-2xl">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-4">Kroegentocht momenteel niet beschikbaar</h2>
                            <p className="text-base lg:text-lg text-theme-muted mb-6">{kroegentochtDisabledMessage}</p>
                            {isSettingsLoading && <p className="text-sm text-theme-muted mb-6">Bezig met controleren van status...</p>}
                            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-theme text-theme-white font-semibold rounded-full">
                                Terug naar Home
                            </Link>
                        </div>
                    </section>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 p-6 sm:p-10">
                        {/* Form Section */}
                        <section className="w-full lg:w-1/2 bg-gradient-theme rounded-3xl shadow-lg p-6 sm:p-8">
                            <h1 className="text-3xl font-bold text-white mb-6">
                                Inschrijven voor de Kroegentocht
                            </h1>

                            {submitted ? (
                                <div className="text-white">
                                    <div className="flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold mb-4 text-center">Inschrijving Voltooid!</h2>
                                    <p className="text-lg mb-4">
                                        Bedankt voor je inschrijving voor de Kroegentocht!
                                    </p>
                                    <p className="text-white/90 mb-2">
                                        Je ontvangt binnenkort een bevestigingsmail met alle details op <strong>{form.email}</strong>.
                                    </p>
                                    <p className="text-white/90 mb-6">
                                        Aantal tickets: <strong>{form.amount_tickets}</strong>
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSubmitted(false);
                                            setForm({
                                                name: '',
                                                email: '',
                                                association: '',
                                                customAssociation: '',
                                                amount_tickets: 1,
                                            });
                                            setParticipants([{ name: '', initial: '' }]);
                                        }}
                                        className="bg-white text-theme-purple font-bold py-2 px-4 rounded hover:bg-white/90 transition"
                                    >
                                        Nieuwe inschrijving
                                    </button>
                                </div>
                            ) : (
                                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                    {error && (
                                        <div className="bg-white/20 text-white px-4 py-3 rounded">
                                            {error}
                                        </div>
                                    )}

                                    {!eventsLoading && !canSignUp && (
                                        <div className="bg-white/20 text-white px-4 py-3 rounded">
                                            Momenteel is er geen kroegentocht gepland. Houd deze pagina in de gaten voor nieuwe data!
                                        </div>
                                    )}

                                    {/* Name */}
                                    <label className="font-semibold text-white">
                                        Naam
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Voor- en achternaam"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                    </label>

                                    {/* Email */}
                                    <label className="font-semibold text-white">
                                        E-mailadres
                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="jouw@email.nl"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                    </label>

                                    {/* Association */}
                                    <label className="font-semibold text-white">
                                        Vereniging
                                        <select
                                            name="association"
                                            value={form.association}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        >
                                            <option value="">Selecteer een vereniging</option>
                                            {ASSOCIATIONS.map((assoc) => (
                                                <option key={assoc} value={assoc}>
                                                    {assoc}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {/* Custom Association */}
                                    {form.association === 'Anders' && (
                                        <label className="font-semibold text-white">
                                            Naam
                                            <input
                                                type="text"
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                                placeholder="Naam van je vereniging"
                                                className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                            />
                                        </label>
                                    )}

                                    {/* Amount of Tickets */}
                                    <label className="font-semibold text-white">
                                        Aantal tickets
                                        <input
                                            type="number"
                                            name="amount_tickets"
                                            value={form.amount_tickets}
                                            onChange={handleChange}
                                            required
                                            min="1"
                                            max="10"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                        <span className="text-sm text-white/80 mt-1 block">
                                            Maximum 10 tickets per inschrijving
                                        </span>
                                    </label>

                                    {/* Participant Names and Initials */}
                                    <div className="bg-white/10 rounded-lg p-4 space-y-3">
                                        <h3 className="font-semibold text-white text-lg mb-2">
                                            Deelnemers ({form.amount_tickets} {form.amount_tickets === 1 ? 'ticket' : 'tickets'})
                                        </h3>
                                        <p className="text-sm text-white/80 mb-3">
                                            Vul voor elk ticket een naam en eerste letter van de achternaam in.
                                        </p>
                                        {participants.map((participant, index) => (
                                            <div key={index} className="bg-white/10 rounded p-3 space-y-2">
                                                <label className="block text-sm font-semibold text-white">
                                                    Ticket {index + 1} - Naam
                                                    <input
                                                        type="text"
                                                        value={participant.name}
                                                        onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                                                        required
                                                        placeholder="Voornaam + eventueel tussenvoegsel"
                                                        className="mt-1 p-2 rounded w-full bg-white text-theme-purple text-sm dark:bg-gray-800 dark:text-theme"
                                                    />
                                                </label>
                                                <label className="block text-sm font-semibold text-white">
                                                    Eerste letter achternaam
                                                    <input
                                                        type="text"
                                                        value={participant.initial}
                                                        onChange={(e) => handleParticipantChange(index, 'initial', e.target.value)}
                                                        required
                                                        placeholder="Bijv. S"
                                                        maxLength={1}
                                                        className="mt-1 p-2 rounded w-20 bg-white text-theme-purple text-sm uppercase dark:bg-gray-800 dark:text-theme"
                                                    />
                                                </label>
                                            </div>
                                        ))}
                                    </div>


                                    <button
                                        type="submit"
                                        disabled={loading || !canSignUp}
                                        className="bg-white text-theme-purple font-bold py-3 px-6 rounded shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading
                                            ? 'Bezig met inschrijven...'
                                            : canSignUp
                                                ? `Inschrijven (€${(form.amount_tickets * 1).toFixed(2).replace('.', ',')})`
                                                : 'Inschrijving nog niet beschikbaar'}
                                    </button>
                                </form>
                            )}
                        </section>

                        {/* Info Section */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-6">
                            {/* Event Info */}
                            <div className="bg-gradient-theme rounded-3xl p-6 shadow-lg">
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    🍻 Over de Kroegentocht
                                </h2>
                                <div className="text-white space-y-3">
                                    {eventsLoading ? (
                                        <p>Evenementomschrijving wordt geladen...</p>
                                    ) : nextEvent?.description ? (
                                        nextEvent.description.split('\n').map((paragraph: string, index: number) => (
                                            <p key={index}>{paragraph}</p>
                                        ))
                                    ) : (
                                        <>
                                            <p>
                                                De jaarlijkse Kroegentocht is een van de grootste evenementen die tweemaal per jaar wordt georganiseerd!
                                            </p>
                                            <p>
                                                Dit is een fantastische kans om verschillende kroegen te bezoeken, nieuwe mensen te ontmoeten
                                                en een onvergetelijke avond te beleven met andere studenten en verenigingen.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="bg-gradient-theme rounded-3xl p-6 shadow-lg">
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    📅 Evenement Details
                                </h2>
                                {eventsLoading ? (
                                    <div className="text-white">Evenementgegevens worden geladen...</div>
                                ) : nextEvent ? (
                                    <div className="text-white space-y-4">
                                        {nextEvent.image && (
                                            <img
                                                src={getImageUrl(nextEvent.image)}
                                                alt={nextEvent.name}
                                                role="button"
                                                onClick={() => openImageModal(getImageUrl(nextEvent.image))}
                                                className="w-full h-48 object-cover rounded-2xl cursor-zoom-in"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/img/placeholder.svg';
                                                }}
                                            />
                                        )}

                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold text-white/80">Evenement:</span>
                                                <span>{nextEvent.name}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold text-white/80">Datum:</span>
                                                <span>{formattedNextEventDate ?? 'Nog te bepalen'}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold text-white/80">Organisatie:</span>
                                                <span>{nextEvent.association || 'Salve Mundi'}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold text-white/80">Contact:</span>
                                                <a href={`mailto:${nextEvent.email}`} className="underline text-white break-all">
                                                    {nextEvent.email}
                                                </a>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold text-white/80">Locatie:</span>
                                                <span>Verschillende locaties in Eindhoven</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-white">
                                        Er is momenteel geen kroegentocht gepland. Houd onze website in de gaten voor toekomstige aankondigingen!
                                    </div>
                                )}
                            </div>

                            {/* Important Info */}
                            <div className="bg-gradient-theme rounded-3xl p-6 shadow-lg">
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    ℹ️ Belangrijke Informatie
                                </h2>
                                <div className="text-white space-y-2">
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Je hoeft <strong>geen lid</strong> te zijn om deel te nemen</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Je ontvangt een bevestigingsmail na inschrijving</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Minimumleeftijd: 18 jaar</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Tickets zijn overdraagbaar</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Bij vragen? Neem contact op via <a href="/contact" className="text-white underline">onze contactpagina</a></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {modalOpen && modalSrc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-w-[95vw] max-h-[95vh]">
                        <img
                            src={modalSrc}
                            alt="Kroegentocht afbeelding"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={closeModal}
                            aria-label="Sluiten"
                            className="mt-3 w-full bg-white text-theme-purple font-semibold py-2 rounded-lg"
                        >
                            Sluiten
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
