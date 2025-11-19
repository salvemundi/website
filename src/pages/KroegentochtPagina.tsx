import { useState } from 'react';
import Navbar from '../components/NavBar';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import Footer from '../components/Footer';
import { pubCrawlEventsApi } from '../lib/api';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Determine final association value
      const finalAssociation = form.association === 'Anders' 
        ? form.customAssociation 
        : form.association;

      // Create signup
      await pubCrawlEventsApi.create({
        name: form.name,
        email: form.email,
        association: finalAssociation,
        amount_tickets: form.amount_tickets,
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting kroegentocht signup:', err);
      setError(err.message || 'Er is een fout opgetreden bij het inschrijven. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full min-h-[65vh] lg:min-h-screen">
        <Navbar activePage="Kroegentocht" />
        <Header
          title="KROEGENTOCHT"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
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
                  disabled={loading}
                  className="bg-oranje text-white font-bold py-3 px-6 rounded hover:bg-geel hover:text-paars transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Bezig met inschrijven...' : 'Inschrijven'}
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
                <p>
                  De jaarlijkse Kroegentocht is een van de grootste evenementen die tweemaal per jaar wordt georganiseerd!
                </p>
                <p>
                  Dit is een fantastische kans om verschillende kroegen te bezoeken, nieuwe mensen te ontmoeten 
                  en een onvergetelijke avond te beleven met andere studenten en verenigingen.
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-paars rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-geel mb-4">
                📅 Evenement Details
              </h2>
              <div className="text-beige space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-geel">Datum:</span>
                  <span>TBA</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-geel">Tijd:</span>
                  <span>TBA</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-geel">Locatie:</span>
                  <span>Verschillende locaties in Eindhoven</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-geel">Prijs:</span>
                  <span>TBA per ticket</span>
                </div>
              </div>
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

        <Footer />
      </main>

      <BackToTopButton />
    </>
  );
}
