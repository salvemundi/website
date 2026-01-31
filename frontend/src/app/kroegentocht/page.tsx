'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { pubCrawlSignupsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import qrService from '@/shared/lib/qr-service';
import QRDisplay from '@/entities/activity/ui/QRDisplay';

import { useSalvemundiPubCrawlEvents, useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { format } from 'date-fns';
import { CheckCircle2, Download } from 'lucide-react';

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
        email: '',
        association: '',
        customAssociation: '',
        // keep as string to allow temporary empty value while editing
        amount_tickets: '1',
        website: '', // Honeypot
    });
    const [participants, setParticipants] = useState<Participant[]>([{ name: '', initial: '' }]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: pubCrawlEvents, isLoading: eventsLoading } = useSalvemundiPubCrawlEvents();
    const { data: siteSettings, isLoading: isSettingsLoading } = useSalvemundiSiteSettings('kroegentocht');

    // Auth & Existing Tickets
    const { user, isAuthenticated } = useAuth();
    const [existingSignups, setExistingSignups] = useState<any[]>([]);

    useEffect(() => {
        const fetchSignups = async () => {
            if (isAuthenticated && user?.email) {
                try {
                    const signups = await directusFetch<any[]>(`/items/pub_crawl_signups?filter[email][_eq]=${encodeURIComponent(user.email)}&filter[payment_status][_eq]=paid&fields=*,pub_crawl_event_id.name&sort=-created_at`);
                    setExistingSignups(signups || []);
                } catch (e) {
                    console.error('Failed to fetch existing kroegentocht signups', e);
                }
            }
        };
        fetchSignups();
    }, [isAuthenticated, user?.email]);

    const downloadTicket = async (index: number, name: string, initial: string, qrToken: string, eventName: string) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = 600;
            const height = 800;
            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#7B2CBF';
            ctx.fillRect(0, 0, width, 100);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`TICKET ${index + 1}`, width / 2, 60);

            ctx.fillStyle = '#333333';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(eventName, width / 2, 160);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(`${name} ${initial}`, width / 2, 220);

            const qrDataUrl = await qrService.generateQRCode(qrToken);
            const qrImg = new Image();
            qrImg.crossOrigin = "anonymous";
            qrImg.onload = () => {
                const qrSize = 400;
                ctx.drawImage(qrImg, (width - qrSize) / 2, 280, qrSize, qrSize);

                ctx.fillStyle = '#666666';
                ctx.font = '20px Arial';
                ctx.fillText('Scan bij de kroegentocht leiders', width / 2, 720);

                ctx.font = '16px Arial';
                ctx.fillText('Salve Mundi', width / 2, 760);

                const link = document.createElement('a');
                link.download = `Ticket-${index + 1}-${name.replace(/\s+/g, '-')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
            qrImg.src = qrDataUrl;

        } catch (e) {
            console.error('Download ticket failed', e);
        }
    };

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
            // allow empty string while the user is editing
            if (value === '') {
                setForm({ ...form, amount_tickets: '' });
                setParticipants([]);
                return;
            }

            const parsed = parseInt(value, 10);
            const clamped = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
            setForm({ ...form, amount_tickets: String(clamped) });

            // Update participants array based on ticket count
            const newParticipants = Array.from({ length: clamped }, (_, i) =>
                participants[i] || { name: '', initial: '' }
            );
            setParticipants(newParticipants);
            return;
        }
        setForm({ ...form, [name]: value });
    };

    useEffect(() => {
        // Auto-fill email if user is logged in (always allow this now)
        if (isAuthenticated && user?.email && form.email === '') {
            setForm(prev => ({ ...prev, email: user.email }));
        }
    }, [isAuthenticated, user?.email]);

    const handleAmountBlur = () => {
        // ensure we have a valid clamped number after leaving the input
        const parsed = parseInt(String(form.amount_tickets), 10);
        const clamped = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
        setForm({ ...form, amount_tickets: String(clamped) });
        const newParticipants = Array.from({ length: clamped }, (_, i) =>
            participants[i] || { name: '', initial: '' }
        );
        setParticipants(newParticipants);
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

        // Honeypot check
        if (form.website) {
            console.log("Bot detected (honeypot)");
            setSubmitted(true); // Fake success
            return;
        }

        if (!nextEvent) {
            setError('Er is momenteel geen kroegentocht beschikbaar om voor in te schrijven.');
            return;
        }

        // Validate that at least the first participant has a name and initial
        if (participants.length === 0 || !participants[0].name.trim()) {
            setError('Vul de naam van de eerste deelnemer in.');
            return;
        }

        if (!/^[A-Za-z]$/.test(String(participants[0].initial).trim())) {
            setError('Vul de eerste letter van de achternaam in voor de eerste deelnemer.');
            return;
        }

        // Validate all participants have name and initial (initial must be exactly 1 letter)
        const invalidParticipants = participants.some(p => !p.name.trim() || !/^[A-Za-z]$/.test(String(p.initial).trim()));
        if (invalidParticipants) {
            setError('Vul voor alle tickets een naam en 1-letter eerste letter van de achternaam in.');
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
            const finalAmount = Number(form.amount_tickets) || 1;

            if (participants.length !== finalAmount) {
                throw new Error('Aantal deelnemers komt niet overeen met het opgegeven aantal tickets.');
            }

            // Use first participant's info as primary registration name
            const primaryName = `${participants[0].name} ${participants[0].initial}`;

            const signup = await pubCrawlSignupsApi.create({
                // store registrant as "FirstName I." (initial)
                name: primaryName,
                email: form.email,
                association: finalAssociation,
                amount_tickets: finalAmount,
                pub_crawl_event_id: nextEvent.id,
                name_initials: nameInitials,
                payment_status: 'open',
            });

            if (!signup || !signup.id) {
                throw new Error('Kon inschrijving niet aanmaken.');
            }

            const totalPrice = (Number(form.amount_tickets) * 1).toFixed(2); // 1 euro per ticket
            const traceId = Math.random().toString(36).substring(7);

            const paymentPayload = {
                amount: totalPrice,
                description: `Kroegentocht Tickets - ${Number(form.amount_tickets) || 1}x`,
                redirectUrl: window.location.origin + `/kroegentocht/bevestiging?id=${signup.id}`,
                registrationId: signup.id,
                registrationType: 'pub_crawl_signup', // Tell backend which collection to update
                email: form.email,
                firstName: participants[0].name,
                lastName: participants[0].initial,
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
                friendlyMessage = 'Je hebt al tickets op dit e-mailadres. Gebruik voor extra tickets een ander adres (bijv. van een vriend) of een alias (bijv. jouwnaam+1@gmail.com).';
            } else if (err?.message) {
                friendlyMessage = isProd ? friendlyMessage : `Fout: ${err.message}`;
            }

            setError(friendlyMessage);
        }
        finally {
            setLoading(false);
        }
    };

    // compute display ticket count for UI
    const displayTicketCount = form.amount_tickets === '' ? 0 : Number(form.amount_tickets);

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title="KROEGENTOCHT"
                    backgroundImage={headerBackgroundImage}
                />
            </div>

            <main className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-main)' }}>
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
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 md:py-12">
                        {/* Existing Tickets Section for Logged in Users */}
                        {existingSignups.length > 0 && (
                            <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple dark:text-white mb-2">
                                    Jouw Tickets ({existingSignups.reduce((sum: number, s: any) => sum + (Number(s.amount_tickets) || 0), 0)})
                                </h1>
                                <p className="text-theme-text-muted dark:text-white/70 mb-6 max-w-3xl">
                                    Je hebt al tickets voor de kroegentocht. Hieronder kun je ze downloaden. <br />
                                    <strong>Let op:</strong> Iedere deelnemer heeft een eigen QR-code nodig. Stuur de tickets door naar je vrienden.
                                    <br /><br />
                                    Wil je <strong>extra tickets</strong> kopen? Vul dan het formulier hieronder in.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {existingSignups.flatMap((signup) => {
                                        const parts = signup.name_initials ? JSON.parse(signup.name_initials) : Array.from({ length: signup.amount_tickets }).map((_, i) => ({ name: `Deelnemer ${i + 1}`, initial: '' }));
                                        return parts.map((p: any, index: number) => ({
                                            ...p,
                                            qrToken: `${signup.qr_token}#${index}`,
                                            eventName: signup.pub_crawl_event_id?.name || 'Kroegentocht',
                                            uniqueKey: `${signup.id}-${index}`
                                        }));
                                    }).map((ticket: any, i: number) => (
                                        <div key={ticket.uniqueKey} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center text-center">
                                            <div className="bg-theme-purple text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                                                TICKET {i + 1}
                                            </div>
                                            <h3 className="font-bold text-theme-purple dark:text-white text-lg mb-1">{ticket.name} {ticket.initial}</h3>
                                            <p className="text-theme-text-muted dark:text-white/60 text-sm mb-4">{ticket.eventName}</p>

                                            <div className="bg-white p-2 rounded-lg shadow-sm mb-4">
                                                <QRDisplay qrToken={ticket.qrToken} size={150} />
                                            </div>

                                            <button
                                                onClick={() => downloadTicket(i, ticket.name, ticket.initial, ticket.qrToken, ticket.eventName)}
                                                className="bg-theme-purple/10 hover:bg-theme-purple/20 text-theme-purple dark:text-theme-purple-light px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-full justify-center"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Form Section */}
                            <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple dark:text-white mb-4 sm:mb-6">
                                    Inschrijven voor de Kroegentocht
                                </h1>

                                {!eventsLoading && !canSignUp ? (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-6 py-8 rounded-xl border border-amber-200 dark:border-amber-500/20 text-center">
                                        <h3 className="text-lg font-bold mb-2">Geen inschrijving mogelijk</h3>
                                        <p>Momenteel is er geen kroegentocht gepland waarvoor je je kunt inschrijven. Houd deze pagina in de gaten voor nieuwe data!</p>
                                    </div>
                                ) : (
                                    submitted ? (
                                        <div className="bg-gradient-to-br from-theme-purple/5 to-theme-purple/10 rounded-2xl p-6 border border-theme-purple/20 text-center">
                                            <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-theme-purple mx-auto mb-4" />
                                            <h2 className="text-2xl font-semibold mb-4 text-theme-purple dark:text-white">Inschrijving Voltooid!</h2>
                                            <p className="text-theme-text-muted dark:text-white/80 text-lg mb-4">
                                                Bedankt voor je inschrijving voor de Kroegentocht!
                                            </p>
                                            <p className="text-theme-text-muted dark:text-white/80 mb-2">
                                                Je ontvangt binnenkort een bevestigingsmail met alle details op <strong className="text-theme-purple dark:text-white">{form.email}</strong>.
                                            </p>
                                            <p className="text-theme-text-muted dark:text-white/80 mb-6">
                                                Aantal tickets: <strong className="text-theme-purple dark:text-white">{Number(form.amount_tickets) || 1}</strong>
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSubmitted(false);
                                                    setForm({
                                                        email: '',
                                                        association: '',
                                                        customAssociation: '',
                                                        amount_tickets: '1',
                                                        website: '',
                                                    });
                                                    setParticipants([{ name: '', initial: '' }]);
                                                }}
                                                className="form-button"
                                            >
                                                Nieuwe inschrijving
                                            </button>
                                        </div>
                                    ) : (
                                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                            {error && (
                                                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/20">
                                                    {error}
                                                </div>
                                            )}

                                            {/* Honeypot */} (
                                            <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                                                <label htmlFor="website">Website</label>
                                                <input
                                                    type="text"
                                                    id="website"
                                                    name="website"
                                                    value={form.website}
                                                    onChange={handleChange}
                                                    tabIndex={-1}
                                                    autoComplete="off"
                                                />
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="form-label">E-mailadres</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="jouw@email.nl"
                                                    className="form-input"
                                                />
                                            </div>

                                            {/* Association */}
                                            <div>
                                                <label className="form-label">Vereniging</label>
                                                <select
                                                    name="association"
                                                    value={form.association}
                                                    onChange={handleChange}
                                                    required
                                                    className="form-input"
                                                >
                                                    <option value="">Selecteer een vereniging</option>
                                                    {ASSOCIATIONS.map((assoc) => (
                                                        <option key={assoc} value={assoc}>
                                                            {assoc}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Custom Association */}
                                            {form.association === 'Anders' && (
                                                <div>
                                                    <label className="form-label">Naam vereniging</label>
                                                    <input
                                                        type="text"
                                                        name="customAssociation"
                                                        value={form.customAssociation}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Naam van je vereniging"
                                                        className="form-input"
                                                    />
                                                </div>
                                            )}

                                            {/* Amount of Tickets */}
                                            <div>
                                                <label className="form-label">Aantal tickets</label>
                                                <input
                                                    type="number"
                                                    name="amount_tickets"
                                                    value={form.amount_tickets}
                                                    onChange={handleChange}
                                                    onBlur={handleAmountBlur}
                                                    required
                                                    min="1"
                                                    max="10"
                                                    className="form-input"
                                                />
                                                <span className="text-sm text-theme-text-muted mt-1 block">
                                                    Maximum 10 tickets per inschrijving
                                                </span>
                                            </div>

                                            {/* Participant Names and Initials */}
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-3 border border-slate-200 dark:border-white/10">
                                                <h3 className="font-semibold text-theme-purple dark:text-white text-lg mb-2">
                                                    Deelnemers ({displayTicketCount} {displayTicketCount === 1 ? 'ticket' : 'tickets'})
                                                </h3>
                                                <p className="text-sm text-theme-text-muted mb-3">
                                                    Vul voor elk ticket een naam en eerste letter van de achternaam in.
                                                </p>
                                                {participants.map((participant, index) => (
                                                    <div key={index} className="bg-white dark:bg-white/5 rounded-lg p-3 space-y-2 border border-slate-200 dark:border-white/10">
                                                        <div>
                                                            <label className="form-label text-sm">Ticket {index + 1} - Naam</label>
                                                            <input
                                                                type="text"
                                                                value={participant.name}
                                                                onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                                                                required
                                                                placeholder="Voornaam + eventueel tussenvoegsel"
                                                                className="form-input text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label text-sm">Eerste letter achternaam</label>
                                                            <input
                                                                type="text"
                                                                value={participant.initial}
                                                                onChange={(e) => handleParticipantChange(index, 'initial', e.target.value)}
                                                                required
                                                                placeholder="Bijv. S"
                                                                maxLength={1}
                                                                className="form-input w-20 uppercase text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || !canSignUp}
                                                className="form-button mt-4 group"
                                            >
                                                <span>
                                                    {loading
                                                        ? 'Bezig met inschrijven...'
                                                        : `Inschrijven (€${(Number(form.amount_tickets) * 1).toFixed(2).replace('.', ',')})`}
                                                </span>
                                                {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                                            </button>
                                        </form>
                                    )
                                )}
                            </section>

                            {/* Info Section */}
                            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                                {/* Event Info */}
                                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
                                    <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                                        <span>🍻</span> Over de Kroegentocht
                                    </h2>
                                    <div className="text-theme-text-muted space-y-3">
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
                                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
                                    <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                                        <span>📅</span> Evenement Details
                                    </h2>
                                    {eventsLoading ? (
                                        <div className="text-theme-text-muted">Evenementgegevens worden geladen...</div>
                                    ) : nextEvent ? (
                                        <div className="text-theme-text-muted space-y-4">
                                            {nextEvent.image && (
                                                <img
                                                    src={getImageUrl(nextEvent.image)}
                                                    alt={nextEvent.name}
                                                    role="button"
                                                    onClick={() => openImageModal(getImageUrl(nextEvent.image))}
                                                    className="w-full h-48 object-cover rounded-2xl cursor-zoom-in hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/img/placeholder.svg';
                                                    }}
                                                />
                                            )}

                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-theme-purple dark:text-white">Evenement:</span>
                                                    <span>{nextEvent.name}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-theme-purple dark:text-white">Datum:</span>
                                                    <span>{formattedNextEventDate ?? 'Nog te bepalen'}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-theme-purple dark:text-white">Organisatie:</span>
                                                    <span>{nextEvent.association || 'Salve Mundi'}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-theme-purple dark:text-white">Contact:</span>
                                                    <a href={`mailto:${nextEvent.email}`} className="underline text-theme-purple dark:text-white break-all">
                                                        {nextEvent.email}
                                                    </a>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-theme-purple dark:text-white">Locatie:</span>
                                                    <span>Verschillende locaties in Eindhoven</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-theme-text-muted">
                                            Er is momenteel geen kroegentocht gepland. Houd onze website in de gaten voor toekomstige aankondigingen!
                                        </div>
                                    )}
                                </div>

                                {/* Important Info */}
                                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
                                    <h2 className="text-xl sm:text-2xl font-bold text-theme-purple dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                                        <span>ℹ️</span> Belangrijke Informatie
                                    </h2>
                                    <ul className="space-y-3 sm:space-y-4">
                                        {[
                                            { icon: '👥', text: 'Je hoeft <strong>geen lid</strong> te zijn om deel te nemen' },
                                            { icon: '📧', text: 'Je ontvangt een bevestigingsmail na inschrijving' },
                                            { icon: '🔞', text: 'Minimumleeftijd: 18 jaar' },
                                            { icon: '🎟️', text: 'Tickets zijn overdraagbaar' },
                                            { icon: '📞', text: 'Bij vragen? Neem contact op via <a href="/contact" class="text-theme-purple underline font-semibold">onze contactpagina</a>' },
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 sm:gap-4">
                                                <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
                                                <span className="text-sm sm:text-base text-theme-text-muted leading-snug" dangerouslySetInnerHTML={{ __html: item.text }} />
                                            </li>
                                        ))}
                                    </ul>
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
