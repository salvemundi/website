'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { introSignupsApi, introParentSignupsApi } from '@/shared/lib/api/salvemundi';
import { sendIntroSignupEmail } from '@/shared/lib/services/email-service';
import { useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { Users, Heart, CheckCircle2 } from 'lucide-react';

export default function IntroPage() {
  const { isAuthenticated, user } = useAuth();

  const [form, setForm] = useState({
    voornaam: '',
    tussenvoegsel: '',
    achternaam: '',
    geboortedatum: '',
    email: '',
    telefoonnummer: user?.phone_number || '',
    favorieteGif: '',
  });

  // keep telefoonnummer in sync when user becomes available
  React.useEffect(() => {
    if (user?.phone_number) {
  setForm(prev => ({ ...prev, telefoonnummer: user?.phone_number || '' }));
    }
  }, [user?.phone_number]);

  // parent form - only keep motivation (availability removed)
  const [parentForm, setParentForm] = useState({ motivation: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: siteSettings, isLoading: isSettingsLoading } = useSalvemundiSiteSettings('intro');
  const isIntroEnabled = siteSettings?.show ?? true;
  const introDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de introweek zijn momenteel gesloten.';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setParentForm({ ...parentForm, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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

          // Best-effort: subscribe parent email to intro newsletter
          try {
            await fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email }),
            });
          } catch (err) {
            console.error('Failed to subscribe parent to intro newsletter', err);
          }
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

          // Best-effort: subscribe participant email to intro newsletter
          try {
            await fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: form.email }),
            });
          } catch (err) {
            console.error('Failed to subscribe participant to intro newsletter', err);
          }

        sendIntroSignupEmail({
          participantEmail: form.email,
          participantFirstName: form.voornaam,
          participantLastName: form.achternaam,
          phoneNumber: form.telefoonnummer,
          dateOfBirth: form.geboortedatum || undefined,
          favoriteGif: form.favorieteGif || undefined,
        }).catch(() => {});
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
          imageFilter={`brightness(0.65) blur(6px)`}
        />
      </div>

      <main>
        {!isIntroEnabled ? (
          <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
            <div className="max-w-4xl mx-auto bg-[var(--bg-card)] rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-2xl">
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
                <p className="text-base lg:text-xl leading-relaxed text-theme">Meld je hieronder aan voor de introweek.</p>
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
                      <form onSubmit={handleSubmit} className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          <h3 className="text-xl lg:text-2xl font-bold text-white">Word Intro Ouder!</h3>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 lg:p-4 mb-4">
                          <p className="text-white text-xs lg:text-sm">
                            <strong>Naam:</strong> {user?.first_name} {user?.last_name}
                            <br />
                            <strong>Email:</strong> {user?.email}
                          </p>
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Telefoonnummer</label>
                          <input
                            type="tel"
                            name="telefoonnummer"
                            value={form.telefoonnummer}
                            onChange={handleChange}
                            required
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Motivatie *</label>
                          <textarea
                            name="motivation"
                            value={(parentForm as any).motivation}
                            onChange={handleParentChange}
                            required
                            rows={4}
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        {error && <p className="text-red-200 text-xs lg:text-sm">{error}</p>}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-theme-purple-lighter text-theme-purple-darker font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                        >
                          {isSubmitting ? 'Bezig...' : 'Meld je aan als Introouder'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSubmit} className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          <h3 className="text-xl lg:text-2xl font-bold text-white">Meld je aan!</h3>
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Voornaam *</label>
                          <input
                            type="text"
                            name="voornaam"
                            value={form.voornaam}
                            onChange={handleChange}
                            required
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Tussenvoegsel</label>
                          <input
                            type="text"
                            name="tussenvoegsel"
                            value={form.tussenvoegsel}
                            onChange={handleChange}
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Achternaam *</label>
                          <input
                            type="text"
                            name="achternaam"
                            value={form.achternaam}
                            onChange={handleChange}
                            required
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Geboortedatum *</label>
                          <input
                            type="date"
                            name="geboortedatum"
                            value={form.geboortedatum}
                            onChange={handleChange}
                            required
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Telefoonnummer *</label>
                          <input
                            type="tel"
                            name="telefoonnummer"
                            value={form.telefoonnummer}
                            onChange={handleChange}
                            required
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-theme-white mb-2 text-sm lg:text-base">Favoriete GIF URL (optioneel)</label>
                          <input
                            type="url"
                            name="favorieteGif"
                            value={form.favorieteGif}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full p-2.5 lg:p-3 bg-theme-white text-theme-purple rounded-lg text-sm lg:text-base"
                          />
                        </div>
                        {error && <p className="text-red-200 text-xs lg:text-sm">{error}</p>}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-theme-purple-lighter text-theme-purple-darker font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
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

    </>
  );
}
