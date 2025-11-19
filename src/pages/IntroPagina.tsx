// src/pages/IntroPagina.tsx
import React, { useState } from 'react';
import Navbar from '../components/NavBar';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import Footer from '../components/Footer';
import { introSignupsApi } from '../lib/api';
import { sendIntroSignupEmail } from '../lib/email-service';

export default function IntroPagina() {
  const [form, setForm] = useState({
    voornaam: '',
    tussenvoegsel: '',
    achternaam: '',
    geboortedatum: '',
    email: '',
    telefoonnummer: '',
    favorieteGif: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await introSignupsApi.create({
        first_name: form.voornaam,
        middle_name: form.tussenvoegsel || undefined,
        last_name: form.achternaam,
        date_of_birth: form.geboortedatum,
        email: form.email,
        phone_number: form.telefoonnummer,
        favorite_gif: form.favorieteGif || undefined,
      });
      
      // Send confirmation + notification email (non-blocking)
      sendIntroSignupEmail({
        participantEmail: form.email,
        participantFirstName: form.voornaam,
        participantLastName: form.achternaam,
        phoneNumber: form.telefoonnummer,
        dateOfBirth: form.geboortedatum || undefined,
        favoriteGif: form.favorieteGif || undefined,
      }).catch((emailError) => {
        console.warn('Failed to send intro signup email:', emailError);
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit intro signup:', err);
      setError(err.message || 'Er is een fout opgetreden bij het versturen van je inschrijving. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full min-h-[65vh] lg:min-h-screen">
        <Navbar activePage="Intro" />
        <Header
          title="INTRO"
          backgroundImage="/img/backgrounds/intro-banner.jpg"
        />
      </div>

      <main className="bg-beige">
        {/* Intro Info Section */}
        <section className="px-10 py-10">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left side - Info text */}
            <div className="flex-1">
              <p className="text-xl leading-relaxed">
                Word jij <span className="font-bold text-paars">student 🎓</span> bij{' '}
                <span className="font-bold text-oranje">Fontys ICT</span>
                <sup className="text-oranje">®</sup> en kijk je uit naar de{' '}
                <span className="font-bold">introweek</span>? Meld je dan nu aan voor een{' '}
                <span className="font-bold">onvergetelijke week</span> vol spannende{' '}
                activiteiten die je met ons en je nieuwe klasgenoten kunt beleven. 
                Sluit je aan bij de <span className="font-bold text-paars">SalveMundi</span>, 
                waar je kunt genieten van een gezellige sfeer en nieuwe vrienden kunt maken. Of doe mee aan een 
                potje <span className="font-bold text-paars">weerwolven van wakkerdam</span>, 
                een spel vol strategie en plezier. Iedereen is welkom, en we beloven dat het niet een{' '}
                <span className="font-bold">geweldige ervaring</span> wordt waar je nog lang over 
                zult napraten!
              </p>
            </div>

            {/* Right side - Form */}
            <div className="flex-1">
              {submitted ? (
                <div className="bg-paars rounded-3xl p-8 text-center">
                  <h2 className="text-3xl font-bold text-geel mb-4">
                    Bedankt voor je inschrijving!
                  </h2>
                  <p className="text-beige text-lg">
                    We hebben je inschrijving ontvangen en kijken ernaar uit om je te zien tijdens de introweek!
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-paars rounded-3xl p-8 shadow-lg space-y-4"
                >
                  {error && (
                    <div className="bg-red-500 text-white p-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  {/* Voornaam */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Voornaam
                    </label>
                    <input
                      type="text"
                      name="voornaam"
                      value={form.voornaam}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-beige text-paars rounded-lg focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Tussenvoegsel */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Tussenvoegsel
                    </label>
                    <input
                      type="text"
                      name="tussenvoegsel"
                      value={form.tussenvoegsel}
                      onChange={handleChange}
                      className="w-full p-3 bg-beige text-paars rounded-lg focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Achternaam */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Achternaam
                    </label>
                    <input
                      type="text"
                      name="achternaam"
                      value={form.achternaam}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-beige text-paars rounded-lg focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Geboortedatum */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Geboortedatum
                    </label>
                    <input
                      type="date"
                      name="geboortedatum"
                      value={form.geboortedatum}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-beige text-paars rounded-lg focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-beige text-paars rounded-lg focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Telefoonnummer */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Telefoonnummer
                    </label>
                    <input
                      type="tel"
                      name="telefoonnummer"
                      value={form.telefoonnummer}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-beige text-paars rounded-lg focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Favoriete GIF */}
                  <div>
                    <label className="block font-semibold text-beige mb-2">
                      Favoriete GIF
                    </label>
                    <input
                      type="text"
                      name="favorieteGif"
                      value={form.favorieteGif}
                      onChange={handleChange}
                      placeholder="URL van je favoriete GIF"
                      className="w-full p-3 bg-beige text-paars rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-oranje"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-oranje text-white font-bold py-3 px-6 rounded-lg hover:bg-geel hover:text-paars transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Bezig met versturen...' : 'Verstuur'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>

      <BackToTopButton />
    </>
  );
}
