import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import ActiviteitCard from "../components/ActiviteitCard";
import Countdown from "../components/Countdown";
import ActiviteitDetailModal from "../components/ActiviteitDetailModal";
import { useEvents } from "../hooks/useApi";
import { eventsApi, getImageUrl, paymentApi } from "../lib/api";
import { sendEventSignupEmail } from "../lib/email-service";
import CalendarView from "../components/CalendarView";

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

export default function ActiviteitenPagina() {
  const { data: events = [], isLoading, error } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [userSignups, setUserSignups] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [signupFeedback, setSignupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Toggle for showing past activities
  const [showPastActivities, setShowPastActivities] = useState(false);

  // Calculate next activity and sort events
  const { nextActivity, upcomingEvents, pastEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { nextActivity: null, upcomingEvents: [], pastEvents: [] };
    }

    const now = new Date();
    const upcoming = events
      .filter(event => new Date(event.event_date) > now)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

    const past = events
      .filter(event => new Date(event.event_date) <= now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    return {
      nextActivity: upcoming.length > 0 ? upcoming[0] : null,
      upcomingEvents: upcoming,
      pastEvents: past
    };
  }, [events]);

  // Combine events based on toggle
  const displayedEvents = useMemo(() => {
    if (showPastActivities) {
      return [...upcomingEvents, ...pastEvents];
    }
    return upcomingEvents;
  }, [upcomingEvents, pastEvents, showPastActivities]);

  // Check for event query parameter and open modal automatically
  useEffect(() => {
    const eventId = searchParams.get('event');
    const paymentStatus = searchParams.get('payment');

    if (paymentStatus === 'success' && eventId) {
      setSignupFeedback({
        type: 'success',
        message: 'Betaling ontvangen! Je inschrijving is definitief. Check je mail voor bevestiging.',
      });
      setSearchParams({}, { replace: true });
      // We roepen hier loadUserSignups NIET direct aan om loops te voorkomen, 
      // de user-dependency hieronder pakt hem vanzelf of we vertrouwen op de refresh.
      return;
    }

    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === parseInt(eventId));
      if (event) {
        handleShowDetails(event);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, events, setSearchParams]);

  // --- CRUCIAAL: FIX VOOR INFINITE LOOP ---
  // We gebruiken user?.id in plaats van het hele user object.
  // Dit voorkomt dat de functie elke render opnieuw wordt aangemaakt.
  const loadUserSignups = useCallback(async () => {
    if (!user?.id) {
      setUserSignups([]);
      return;
    }

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_DIRECTUS_URL}/items/event_signups?filter[directus_relations][_eq]=${user.id}&fields=event_id.id,event_id.price_members,payment_status&limit=-1`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
      );
      
      if (!resp.ok) return; // Stil falen om loops bij 401 errors te voorkomen
      
      const data = await resp.json();
      const ids = (data.data || [])
        .filter((s: any) => {
            if (s.payment_status === 'paid') return true;
            const price = Number(s.event_id?.price_members) || 0;
            // Gratis events zijn ook geldig
            if (price === 0) return true;
            return false;
        })
        .map((s: any) => s.event_id?.id || s.event_id)
        .filter(Boolean);

      setUserSignups(ids);
    } catch (e) {
      console.error('Failed to load user signups', e);
    }
  }, [user?.id]); // <--- ALLEEN ID, NIET HET HELE OBJECT

  // Voer uit bij mounten of als user ID verandert
  useEffect(() => {
    loadUserSignups();
  }, [loadUserSignups]);

  // Start signup by opening the details modal
  const handleSignup = (activity: any) => {
    handleShowDetails(activity);
  };

  // Open modal with activity details
  const handleShowDetails = (activity: any) => {
    const processedActivity = {
      ...activity,
      title: activity.name || activity.title,
      price: Number(activity.price_members) || Number(activity.price) || 0,
      date: activity.event_date || activity.date,
      image: getImageUrl(activity.image),
      committee_email: activity.committee_email || buildCommitteeEmail(activity.committee_name),
    };
    setSelectedActivity(processedActivity);
    setIsModalOpen(true);
  };

  // Handle signup from modal and submit immediately
  const handleModalSignup = async (data: { activity: any; email: string; name: string; phoneNumber: string }) => {
    if (!data.activity?.id) {
      throw new Error('Deze activiteit kan niet worden gevonden.');
    }

    const eventTitle = data.activity.title || data.activity.name || 'Activiteit';
    const eventDate = data.activity.event_date || data.activity.date || new Date().toISOString();
    const eventPrice = Number(data.activity.price) || Number(data.activity.price_members) || 0;
    
    const userName = user 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Onbekend'
      : data.name || 'Onbekend';

    try {
      const signup = await eventsApi.createSignup({
        event_id: data.activity.id,
        email: data.email,
        name: data.name,
        phone_number: data.phoneNumber,
        user_id: user?.id,
        event_name: eventTitle,
        event_date: eventDate,
        event_price: eventPrice,
      });

      if (eventPrice > 0) {
        try {
          const currentUrl = window.location.href.split('?')[0];
          
          const paymentResponse = await paymentApi.create({
            amount: eventPrice,
            description: `Inschrijving ${eventTitle}`,
            redirectUrl: `${currentUrl}?payment=success&event=${data.activity.id}`,
            registrationId: signup.id,
            userId: user?.id,
            email: data.email,
            isContribution: false
          });

          window.location.href = paymentResponse.checkoutUrl;
          return;

        } catch (paymentError: any) {
          console.error('Betaling initialisatie mislukt:', paymentError);
          throw new Error('Het opstarten van de betaling is mislukt. Probeer het nogmaals.');
        }
      }

      try {
        const { generateQRCode } = await import('../lib/qr-service');
        const qrCodeDataUrl = signup?.qr_token ? await generateQRCode(signup.qr_token) : undefined;

        await sendEventSignupEmail({
          recipientEmail: data.email,
          recipientName: data.name || 'Deelnemer',
          eventName: eventTitle,
          eventDate,
          eventPrice,
          phoneNumber: data.phoneNumber,
          userName,
          qrCodeDataUrl,
          committeeName: data.activity.committee_name,
          committeeEmail: data.activity.committee_email,
          contactName: data.activity.contact_name,
          contactPhone: data.activity.contact_phone,
        });
      } catch (emailError) {
        console.error('Kon bevestigingsmail niet versturen:', emailError);
      }

      setSignupFeedback({
        type: 'success',
        message: `Je bent succesvol ingeschreven voor ${eventTitle}.`,
      });
      setTimeout(() => setSignupFeedback(null), 5000);
      
      setIsModalOpen(false);
      await loadUserSignups();

    } catch (error: any) {
      console.error('Error creating signup:', error);
      const message = error?.message || 'Er is iets misgegaan bij het inschrijven. Probeer het opnieuw.';
      throw new Error(message);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full">
        <Header
          title="ACTIVITEITEN"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
        />
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-beige">
        <div className="flex flex-col gap-6 w-full">
          {nextActivity && (
            <Countdown
              targetDate={nextActivity.event_date}
              title={nextActivity.name}
              onSignup={() => handleShowDetails(nextActivity)}
            />
          )}
          <section className="w-full rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-geel">
                {showPastActivities ? 'Alle Activiteiten' : 'Komende Activiteiten'}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    const raw = import.meta.env.VITE_EMAIL_API_ENDPOINT || '';
                    let base = '';
                    try {
                      const url = new URL(raw);
                      base = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
                    } catch (e) {
                      if (raw.includes('/send-email')) {
                        base = raw.split('/send-email')[0];
                      } else if (raw) {
                        base = raw.replace(/\/+$/, '');
                      }
                    }
                    if (!base) base = 'https://api.salvemundi.nl';

                    const calendarUrl = `${base}/calendar`;
                    const webcalUrl = calendarUrl.replace(/^https?:/, 'webcal:');

                    window.location.href = webcalUrl;

                    setTimeout(() => {
                      alert(
                        `Agenda abonnement gestart!\n\n` +
                        `Als het niet automatisch opent, gebruik deze URL:\n${calendarUrl}\n\n` +
                        `Voor Google Calendar: Ga naar instellingen > "Agenda toevoegen" > "Via URL" en plak de URL.\n` +
                        `Voor Outlook: Ga naar "Agenda toevoegen" > "Abonneren via internet" en plak de URL.`
                      );
                    }, 1000);
                  }}
                  className="px-4 py-2 rounded-full font-semibold transition-all hover:scale-105 shadow-md bg-white text-paars border-2 border-paars hover:bg-paars hover:text-white"
                  title="Abonneer op de agenda - updates automatisch"
                >
                  📅 Sync Agenda
                </button>

                <div className="flex rounded-full border-2 border-paars overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'grid' ? 'bg-paars text-beige' : 'bg-white text-paars'
                      }`}
                  >
                    Raster
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'list' ? 'bg-paars text-beige' : 'bg-white text-paars'
                      }`}
                  >
                    Lijst
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-paars text-beige' : 'bg-white text-paars'
                      }`}
                  >
                    Kalender
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPastActivities(prev => !prev);
                  }}
                  className={`px-4 py-2 rounded-full font-semibold transition-all hover:scale-105 shadow-md ${showPastActivities
                    ? 'bg-paars text-white hover:bg-opacity-90'
                    : 'bg-geel text-paars hover:bg-opacity-90'
                    }`}
                >
                  {showPastActivities ? 'Verberg Afgelopen' : 'Toon Afgelopen'}
                </button>
              </div>
            </div>

            {signupFeedback && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 font-semibold ${signupFeedback.type === 'success'
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : 'bg-red-50 border-red-400 text-red-800'
                  }`}
              >
                {signupFeedback.message}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-6">
                {isLoading ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-gray-600">Activiteiten laden...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-red-600">Fout bij laden van activiteiten</p>
                  </div>
                ) : displayedEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-gray-600">Geen activiteiten gevonden</p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'calendar' ? (
                      <CalendarView
                        events={[...upcomingEvents, ...(showPastActivities ? pastEvents : [])]}
                        onEventClick={handleShowDetails}
                      />
                    ) : (
                      <>
                        {upcomingEvents.length > 0 && (
                          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr' : 'flex flex-col gap-3'}>
                            {upcomingEvents.map((event) => (
                              <ActiviteitCard
                                key={event.id}
                                description={event.description}
                                image={getImageUrl(event.image)}
                                date={event.event_date}
                                title={event.name}
                                price={Number(event.price_members) || 0}
                                isPast={false}
                                onSignup={() => handleSignup(event)}
                                onShowDetails={() => handleShowDetails(event)}
                                isSignedUp={userSignups.includes(event.id)}
                                variant={viewMode}
                                committeeName={event.committee_name}
                              />
                            ))}
                          </div>
                        )}

                        {showPastActivities && upcomingEvents.length > 0 && pastEvents.length > 0 && (
                          <div className="border-t-4 border-dashed border-paars opacity-50"></div>
                        )}

                        {showPastActivities && pastEvents.length > 0 && (
                          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr' : 'flex flex-col gap-3'}>
                            {pastEvents.map((event) => (
                              <ActiviteitCard
                                key={event.id}
                                description={event.description}
                                image={getImageUrl(event.image)}
                                date={event.event_date}
                                title={event.name}
                                price={Number(event.price_members) || 0}
                                isPast={true}
                                onSignup={() => handleSignup(event)}
                                onShowDetails={() => handleShowDetails(event)}
                                isSignedUp={userSignups.includes(event.id)}
                                variant={viewMode}
                                committeeName={event.committee_name}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

          </section>
        </div>

      </main>

      <BackToTopButton />

      {selectedActivity && (
        <ActiviteitDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activity={selectedActivity}
          isPast={selectedActivity.event_date ? new Date(selectedActivity.event_date) <= new Date() : false}
          onSignup={handleModalSignup}
          isSignedUp={userSignups.includes(selectedActivity.id)} 
        />
      )}
    </>
  );
}