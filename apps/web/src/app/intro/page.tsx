'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { introSignupsApi, introParentSignupsApi } from '@/shared/lib/api/salvemundi';
import { sendIntroSignupEmail } from '@/shared/lib/services/email-service';
import { useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { isValidPhoneNumber } from '@/shared/components/PhoneNumberInput';
import { Users, Heart, CheckCircle2 } from 'lucide-react';
// react-datepicker removed to prefer native date inputs

export default function IntroPage() {
  const { isAuthenticated, user } = useAuth();

  const [form, setForm] = useState({
    voornaam: '',
    tussenvoegsel: '',
    achternaam: '',
    geboortedatum: '' as string,
    email: '',
    telefoonnummer: user?.phone_number || '',

    favorieteGif: '',
    website: '', // Honeypot
  });

  // keep telefoonnummer in sync when user becomes available
  useEffect(() => {
    if (user?.phone_number) {
      setForm(prev => ({ ...prev, telefoonnummer: user?.phone_number || '' }));
    }
  }, [user?.phone_number]);

  // parent form - only keep motivation (availability removed)
  const [parentForm, setParentForm] = useState({ motivation: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [hasParentSignup, setHasParentSignup] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Check whether the logged-in user already signed up as a parent
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (user?.id) {
        try {
          const existing = await introParentSignupsApi.getByUserId(String(user.id));
          if (!mounted) return;
          if (existing && Array.isArray(existing) && existing.length > 0) {
            setHasParentSignup(true);
          } else {
            setHasParentSignup(false);
          }
        } catch (e) {
          console.error('Failed to check existing parent signup', e);
          if (mounted) setHasParentSignup(false);
        }
      } else {
        if (mounted) setHasParentSignup(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        setLightboxSrc(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const { data: siteSettings, isLoading: isSettingsLoading } = useSalvemundiSiteSettings('intro');
  // Default to false (closed) if settings are missing or loading error, to prevent accidental signups
  const isIntroEnabled = siteSettings?.show ?? false;
  const introDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de introweek zijn momenteel gesloten.';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
    if (e.target.name === 'telefoonnummer' && phoneError) setPhoneError(null);
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setParentForm({ ...parentForm, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneError(null);

    // Honeypot check
    if (form.website) {
      console.log("Bot detected (intro honeypot)");
      setSubmitted(true);
      return;
    }

    // Content check
    if ((form.voornaam + form.achternaam).match(/https?:\/\//)) {
      setError("Ongeldige invoer.");
      return;
    }

    // determine phone to validate (for authenticated parent we allow user phone fallback)
    const phoneToValidate = isAuthenticated && user ? (form.telefoonnummer || user.phone_number || '') : form.telefoonnummer;

    if (isAuthenticated && user) {
      // Lenient validation for Intro Ouder (matching Reis page)
      if (!phoneToValidate || phoneToValidate.length < 10) {
        setPhoneError('Ongeldig telefoonnummer');
        return;
      }
    } else {
      // Strict validation for general signups
      if (!isValidPhoneNumber(phoneToValidate)) {
        setPhoneError('Ongeldig telefoonnummer');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isAuthenticated && user) {
        await introParentSignupsApi.create({
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: (form.telefoonnummer || user.phone_number || '') as string,
          motivation: parentForm.motivation || '',
          // send empty values for fields removed from form to satisfy API
          availability: [],
        });
      } else {
        await introSignupsApi.create({
          first_name: form.voornaam,
          middle_name: form.tussenvoegsel || undefined,
          last_name: form.achternaam,
          date_of_birth: form.geboortedatum,
          email: form.email,
          phone_number: form.telefoonnummer,
          favorite_gif: form.favorieteGif || undefined,
        });

        sendIntroSignupEmail({
          participantEmail: form.email,
          participantFirstName: form.voornaam,
          participantLastName: form.achternaam,
          phoneNumber: form.telefoonnummer,
          dateOfBirth: form.geboortedatum || undefined,
          favoriteGif: form.favorieteGif || undefined,
        }).catch(() => { });
      }
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit intro signup:', err);
      setError(err?.message || 'Er is een fout opgetreden bij het versturen van je inschrijving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full">
        <PageHeader
          title="INTRO - AANMELDEN"
          backgroundImage="/img/backgrounds/intro-banner.jpg"
          /* match activiteiten banner size and add subtle blur */
          contentPadding="py-20"
          imageFilter={`brightness(0.65)`}
        />
      </div>

      <main>
        {!isIntroEnabled ? (
          <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
            <div className="max-w-4xl mx-auto bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-2xl">
              <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-4">Intro momenteel niet beschikbaar</h2>
              <p className="text-base lg:text-lg text-theme-muted mb-6">{introDisabledMessage}</p>
              {isSettingsLoading && <p className="text-sm text-theme-muted mb-6">Bezig met controleren van status...</p>}
              <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-theme text-theme-white font-semibold rounded-full">
                Terug naar Home
              </Link>
            </div>
          </section>
        ) : (
          <section className="px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto">
              <div className="flex-1">
                <div className="text-theme dark:text-white">
                  {isAuthenticated ? (
                    <>
                      <h2 className="text-2xl lg:text-3xl font-bold mb-4">Word Intro Ouder — begeleid de nieuwe lichting</h2>
                      <p className="text-base lg:text-lg leading-relaxed mb-4">
                        Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
                        help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen. Het is gezellig, laagdrempelig en
                        een mooie kans om jouw ervaring door te geven.
                      </p>

                      <h3 className="font-semibold mb-2">Wat doet een Intro Ouder?</h3>
                      <ul className="list-disc list-inside mb-4 text-base lg:text-lg">
                        <li className="mb-1"><strong>Begeleiden:</strong> Help kleine groepjes nieuwe leden tijdens activiteiten en zorg voor een veilige sfeer.</li>
                        <li className="mb-1"><strong>Mentorschap:</strong> Geef tips over studie, rooster en het vinden van de weg in Eindhoven.</li>
                        <li className="mb-1"><strong>Gezelligheid:</strong> Organiseer leuke momenten binnen je groep — simpele spellen, gesprekken en samen eten doen wonderen.</li>
                      </ul>

                      <h3 className="font-semibold">Waarom meedoen?</h3>
                      <ul className="list-disc list-inside mb-4 text-base lg:text-lg">
                        <li className="mb-1"><strong>Impact:</strong> Je helpt nieuwe leden zich echt thuis te voelen.</li>
                        <li className="mb-1"><strong>Netwerk:</strong> Leer commissieleden en andere actieve leden kennen.</li>
                        <li className="mb-1"><strong>Fun:</strong> Gratis pizza, goede verhalen en herinneringen die je niet snel vergeet.</li>
                      </ul>

                      <p className="text-base lg:text-lg leading-relaxed mb-2">Wil je meedoen? Vul dan het formulier aan de rechterkant in en vertel kort waarom jij de perfecte Intro Ouder bent.</p>
                      <p className="text-sm text-theme-muted">Heb je vragen? Neem contact op met de introcommissie.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl lg:text-3xl font-bold mb-4">Klaar om je studententijd met een knal te beginnen?</h2>
                      <p className="text-base lg:text-lg leading-relaxed mb-4">
                        Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
                      </p>

                      <h3 className="font-semibold mb-2">Waarom je dit niet wilt missen</h3>
                      <ul className="list-disc list-inside mb-4 text-base lg:text-lg">
                        <li className="mb-1"><strong>Legendarische Feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.</li>
                        <li className="mb-1"><strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.</li>
                        <li className="mb-1"><strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.</li>
                      </ul>

                      <h3 className="font-semibold">Schrijf je nu in!</h3>
                      <p className="text-base lg:text-lg leading-relaxed mb-2">Ben jij erbij? Vul het onderstaande formulier in om je plek te reserveren voor de gezelligste week van het jaar. Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.</p>
                      <p className="text-sm text-theme-muted">Let op: De plaatsen zijn beperkt, dus wacht niet te lang met aanmelden!</p>
                    </>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <img
                    src="/img/backgrounds/homepage-banner.jpg"
                    alt="polonaise"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer"
                    loading="lazy"
                    onClick={() => { setLightboxSrc('/img/backgrounds/homepage-banner.jpg'); setLightboxOpen(true); }}
                  />
                  <img
                    src="/img/Intro-2-2025.jpg"
                    alt="polonaise"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer"
                    loading="lazy"
                    onClick={() => { setLightboxSrc('/img/Intro-2-2025.jpg'); setLightboxOpen(true); }}
                  />
                  <img
                    src="/img/Intro-3-2025.jpg"
                    alt="lasergame"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer"
                    loading="lazy"
                    onClick={() => { setLightboxSrc('/img/Intro-3-2025.jpg'); setLightboxOpen(true); }}
                  />
                  <img
                    src="/img/Intro-4-2025.jpg"
                    alt="Groep"
                    className="w-full h-32 object-cover rounded-lg cursor-lg cursor-pointer"
                    loading="lazy"
                    onClick={() => { setLightboxSrc('/img/Intro-4-2025.jpg'); setLightboxOpen(true); }}
                  />
                  <img
                    src="/img/Intro2025.jpg"
                    alt="Groep"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer"
                    loading="lazy"
                    onClick={() => { setLightboxSrc('/img/Intro2025.jpg'); setLightboxOpen(true); }}
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                {submitted ? (
                  <div className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-white mx-auto mb-4" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-theme-purple-lighter mb-4">Bedankt!</h2>
                    <p className="text-theme-white text-base lg:text-lg">We hebben je inschrijving ontvangen.</p>
                  </div>
                ) : (
                  <>
                    {isAuthenticated ? (
                      hasParentSignup ? (
                        <div className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4 text-center">
                          <h3 className="text-xl lg:text-2xl font-bold text-white">Je hebt je al aangemeld als Intro Ouder</h3>
                          <p className="text-theme-text-muted dark:text-theme-text-muted">Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                            <h3 className="text-xl lg:text-2xl font-bold text-theme-purple">Word Intro Ouder!</h3>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3 lg:p-4 mb-4">
                            <p className="text-white text-xs lg:text-sm">
                              <strong>Naam:</strong> {user?.first_name} {user?.last_name}
                              <br />
                              <strong>Email:</strong> {user?.email}
                            </p>
                          </div>
                          <div>
                            <label htmlFor="telefoonnummer-ouder" className="form-label">Telefoonnummer *</label>
                            <PhoneInput
                              id="telefoonnummer-ouder"
                              name="telefoonnummer"
                              value={form.telefoonnummer}
                              onChange={handleChange}
                              required
                              placeholder="06 12345678"
                              className="form-input"
                            />
                            {phoneError && <p className="text-red-200 text-xs lg:text-sm mt-1">{phoneError}</p>}
                          </div>
                          <div>
                            <label htmlFor="motivation" className="form-label">Motivatie *</label>
                            <textarea
                              id="motivation"
                              name="motivation"
                              value={(parentForm as any).motivation}
                              onChange={handleParentChange}
                              required
                              rows={4}
                              className="form-input"
                            />
                          </div>
                          {error && <p className="text-red-200 text-xs lg:text-sm">{error}</p>}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="form-button"
                          >
                            {isSubmitting ? 'Bezig...' : 'Meld je aan als Introouder'}
                          </button>
                        </form>
                      )
                    ) : (
                      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
                        {/* Honeypot */}
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

                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                          <h3 className="text-xl lg:text-2xl font-bold text-theme-purple">Meld je aan!</h3>
                        </div>
                        <div>
                          <label htmlFor="voornaam" className="form-label">Voornaam *</label>
                          <input
                            id="voornaam"
                            type="text"
                            name="voornaam"
                            value={form.voornaam}
                            onChange={handleChange}
                            required
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="tussenvoegsel" className="form-label">Tussenvoegsel</label>
                          <input
                            id="tussenvoegsel"
                            type="text"
                            name="tussenvoegsel"
                            value={form.tussenvoegsel}
                            onChange={handleChange}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="achternaam" className="form-label">Achternaam *</label>
                          <input
                            id="achternaam"
                            type="text"
                            name="achternaam"
                            value={form.achternaam}
                            onChange={handleChange}
                            required
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="geboortedatum" className="form-label">Geboortedatum *</label>
                          <input
                            id="geboortedatum"
                            type="date"
                            name="geboortedatum"
                            value={form.geboortedatum}
                            onChange={handleChange}
                            className="form-input w-full"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="form-label">Email *</label>
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="telefoonnummer" className="form-label">Telefoonnummer *</label>
                          <PhoneInput
                            id="telefoonnummer"
                            name="telefoonnummer"
                            value={form.telefoonnummer}
                            onChange={handleChange}
                            required
                            className="form-input"
                          />
                          {phoneError && <p className="text-red-200 text-xs lg:text-sm mt-1">{phoneError}</p>}
                        </div>
                        <div>
                          <label htmlFor="favorieteGif" className="form-label">Favoriete GIF URL (optioneel)</label>
                          <input
                            id="favorieteGif"
                            type="url"
                            name="favorieteGif"
                            value={form.favorieteGif}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="form-input"
                          />
                        </div>
                        {error && <p className="text-red-200 text-xs lg:text-sm">{error}</p>}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="form-button"
                        >
                          {isSubmitting ? 'Bezig...' : 'Verstuur'}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {lightboxOpen && lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setLightboxOpen(false); setLightboxSrc(null); } }}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => { setLightboxOpen(false); setLightboxSrc(null); }}
              className="absolute top-2 right-2 z-50 bg-black/40 text-white rounded-full p-2 hover:bg-black/60"
              aria-label="Sluiten"
            >
              ×
            </button>
            <img src={lightboxSrc} alt="Foto" className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

    </>
  );
}


