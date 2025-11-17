// src/pages/IntroPagina.tsx
import React, { useState } from 'react';
import Navbar from '../components/NavBar';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import Footer from '../components/Footer';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Hier zou je de data naar een backend kunnen sturen
  };

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Intro" />
        <Header
          title="INTRO"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
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
                    className="w-full bg-oranje text-white font-bold py-3 px-6 rounded-lg hover:bg-geel hover:text-paars transition-colors duration-300"
                  >
                    Verstuur
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
