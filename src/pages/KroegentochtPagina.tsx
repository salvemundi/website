import { useMemo, useState } from 'react';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import { pubCrawlSignupsApi, getImageUrl } from '../lib/api';
import { usePubCrawlEvents } from '../hooks/useApi';
import { format } from 'date-fns';
import { sendEventSignupEmail } from '../lib/email-service';

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

export default function KroegentochtPagina() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    association: '',
    customAssociation: '',
    amount_tickets: 1,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: pubCrawlEvents, isLoading: eventsLoading } = usePubCrawlEvents();

  const nextEvent = useMemo(() => {
    if (!pubCrawlEvents || pubCrawlEvents.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validEvents = pubCrawlEvents.filter((event) => {
      if (!event.date) return false;
      const parsed = new Date(event.date);
      if (isNaN(parsed.getTime())) return false;

      const normalized = new Date(parsed);
      normalized.setHours(0, 0, 0, 0);
      return normalized.getTime() >= today.getTime();
    });

    if (validEvents.length === 0) return null;

    validEvents.sort((a, b) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'amount_tickets') {
      const parsed = parseInt(value, 10);
      const clamped = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
      setForm({ ...form, amount_tickets: clamped });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextEvent) {
      setError('Er is momenteel geen kroegentocht beschikbaar om voor in te schrijven.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine final association value
      const finalAssociation = form.association === 'Anders'
        ? form.customAssociation
        : form.association;

      // Create or update signup
      await pubCrawlSignupsApi.create({
        name: form.name,
        email: form.email,
        association: finalAssociation,
        amount_tickets: form.amount_tickets,
        pub_crawl_event_id: nextEvent.id,
      });

      const eventDate = nextEvent.date || new Date().toISOString();
      const eventPrice = Number(
        (nextEvent as any).price ??
        (nextEvent as any).ticket_price ??
        (nextEvent as any).price_members ??
        0
      );
      const contactName = (nextEvent as any).contact_name;
      const contactPhone = (nextEvent as any).contact_phone;

      try {
        await sendEventSignupEmail({
          recipientEmail: form.email,
          recipientName: form.name || 'Deelnemer',
          eventName: nextEvent.name || 'Kroegentocht',
          eventDate,
          eventPrice,
          phoneNumber: undefined,
          userName: form.name || form.email,
          committeeName: nextEvent.association || 'Salve Mundi',
          committeeEmail: nextEvent.email,
          contactName,
          contactPhone,
        });
      } catch (emailErr) {
        console.error('Kon kroegentocht bevestigingsmail niet versturen:', emailErr);
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting kroegentocht signup:', err);
      const friendlyMessage = err?.message?.includes('RECORD_NOT_UNIQUE')
        ? 'Dit e-mailadres staat al geregistreerd voor deze kroegentocht.'
        : (err.message || 'Er is een fout opgetreden bij het inschrijven. Probeer het opnieuw.');
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full">
        <Header
          title="KROEGENTOCHT"
          backgroundImage={headerBackgroundImage}
        />
      </div>

      <main className="bg-beige min-h-screen">
        <div className="flex flex-col lg:flex-row gap-6 p-6 sm:p-10">
          {/* Form Section */}
          <section className="w-full lg:w-1/2 bg-paars rounded-3xl shadow-lg p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-geel mb-6">
              Inschrijven voor de Kroegentocht
            </h1>

            {submitted ? (
              <div className="text-geel">
                <h2 className="text-2xl font-semibold mb-4">✅ Inschrijving Voltooid!</h2>
                <p className="text-lg mb-4">
                  Bedankt voor je inschrijving voor de Kroegentocht!
                </p>
                <p className="text-beige">
                  Je ontvangt binnenkort een bevestigingsmail met alle details op <strong>{form.email}</strong>.
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
                  }}
                  className="mt-6 bg-oranje text-white font-bold py-2 px-4 rounded hover:bg-geel hover:text-paars transition"
                >
                  Nieuwe inschrijving
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {!eventsLoading && !canSignUp && (
                  <div className="bg-oranje/10 border border-oranje text-beige px-4 py-3 rounded">
                    Momenteel is er geen kroegentocht gepland. Houd deze pagina in de gaten voor nieuwe data!
                  </div>
                )}

                {/* Name */}
                <label className="font-semibold text-geel">
                  Naam
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Voor- en achternaam"
                    className="mt-1 p-2 rounded w-full bg-beige text-paars"
                  />
                </label>

                {/* Email */}
                <label className="font-semibold text-geel">
                  E-mailadres
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="jouw@email.nl"
                    className="mt-1 p-2 rounded w-full bg-beige text-paars"
                  />
                </label>

                {/* Association */}
                <label className="font-semibold text-geel">
                  Vereniging
                  <select
                    name="association"
                    value={form.association}
                    onChange={handleChange}
                    required
                    className="mt-1 p-2 rounded w-full bg-beige text-paars"
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
                  <label className="font-semibold text-geel">
                    Andere vereniging
                    <input
                      type="text"
                      name="customAssociation"
                      value={form.customAssociation}
                      onChange={handleChange}
                      required
                      placeholder="Naam van je vereniging"
                      className="mt-1 p-2 rounded w-full bg-beige text-paars"
                    />
                  </label>
                )}

                {/* Amount of Tickets */}
                <label className="font-semibold text-geel">
                  Aantal tickets
                  <input
                    type="number"
                    name="amount_tickets"
                    value={form.amount_tickets}
                    onChange={handleChange}
                    required
                    min="1"
                    max="10"
                    className="mt-1 p-2 rounded w-full bg-beige text-paars"
                  />
                  <span className="text-sm text-beige mt-1 block">
                    Maximum 10 tickets per inschrijving
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !canSignUp}
                  className="bg-oranje text-white font-bold py-3 px-6 rounded hover:bg-geel hover:text-paars transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Bezig met inschrijven...'
                    : canSignUp
                      ? 'Inschrijven'
                      : 'Inschrijving nog niet beschikbaar'}
                </button>
              </form>
            )}
          </section>

          {/* Info Section */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            {/* Event Info */}
            <div className="bg-paars rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-geel mb-4">
                🍻 Over de Kroegentocht
              </h2>
              <div className="text-beige space-y-3">
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
            <div className="bg-paars rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-geel mb-4">
                📅 Evenement Details
              </h2>
              {eventsLoading ? (
                <div className="text-beige">Evenementgegevens worden geladen...</div>
              ) : nextEvent ? (
                <div className="text-beige space-y-4">
                  {nextEvent.image && (
                    <img
                      src={getImageUrl(nextEvent.image)}
                      alt={nextEvent.name}
                      className="w-full h-48 object-cover rounded-2xl border-2 border-geel/40"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/placeholder.svg';
                      }}
                    />
                  )}

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-geel">Evenement:</span>
                      <span>{nextEvent.name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-geel">Datum:</span>
                      <span>{formattedNextEventDate ?? 'Nog te bepalen'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-geel">Organisatie:</span>
                      <span>{nextEvent.association || 'Salve Mundi'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-geel">Contact:</span>
                      <a href={`mailto:${nextEvent.email}`} className="underline text-geel break-all">
                        {nextEvent.email}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-geel">Locatie:</span>
                      <span>Verschillende locaties in Eindhoven</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-beige">
                  Er is momenteel geen kroegentocht gepland. Houd onze website in de gaten voor toekomstige aankondigingen!
                </div>
              )}
            </div>

            {/* Important Info */}
            <div className="bg-paars rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-geel mb-4">
                ℹ️ Belangrijke Informatie
              </h2>
              <div className="text-beige space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-geel">•</span>
                  <span>Je hoeft <strong>geen lid</strong> te zijn om deel te nemen</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-geel">•</span>
                  <span>Je ontvangt een bevestigingsmail na inschrijving</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-geel">•</span>
                  <span>Minimumleeftijd: 18 jaar</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-geel">•</span>
                  <span>Tickets zijn overdraagbaar</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-geel">•</span>
                  <span>Bij vragen? Neem contact op via <a href="/contact" className="text-geel underline">onze contactpagina</a></span>
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <BackToTopButton />
    </>
  );
}
