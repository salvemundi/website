// src/pages/InschrijvenPagina.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/NavBar';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import Footer from '../components/Footer';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { nl } from 'date-fns/locale';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

const gf = new GiphyFetch('rEB6G7lJ2bM6n1enoImai0iGoFm7tMnm');

export default function SignUp() {
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    voornaam: user?.first_name || '',
    tussenvoegsel: '',
    achternaam: user?.last_name || '',
    email: user?.email || '',
    geboortedatum: null as Date | null,
    telefoon: user?.phone_number || '',
    favorieteGif: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [gifs, setGifs] = useState<any[]>([]);
  const [gifQuery, setGifQuery] = useState('Fontys'); // default search

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function searchGifs(query: string) {
    const { data } = await gf.search(query, { limit: 200 });
    setGifs(data);
  }

  const handleGifSearch = async () => {
    if (form.favorieteGif) {
      setForm({ ...form, favorieteGif: '' });
    }
    await searchGifs(gifQuery);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.favorieteGif) {
      alert('Selecteer een favoriete GIF om het formulier te versturen.');
      return;
    }
    setSubmitted(true);
  };

  // Pre-fill form with user data when user loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        voornaam: user.first_name || prev.voornaam,
        achternaam: user.last_name || prev.achternaam,
        email: user.email || prev.email,
        telefoon: user.phone_number || prev.telefoon,
      }));
    }
  }, [user]);

  // Run default search on page load
  useEffect(() => {
    searchGifs(gifQuery);
  }, []);

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Inschrijven" />
        <Header
          title="WORD LID!"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
        />
      </div>

      <main className="bg-beige">
        <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-10">
        {/* Form Section */}
        <section className="w-full sm:w-1/2 bg-paars rounded-3xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-geel mb-6">
            Inschrijfformulier
          </h1>

          {user?.is_member ? (
            <div className="text-geel text-xl">
              <p className="mb-4">Je bent al lid van Salve Mundi!</p>
              <p className="text-beige text-base">
                Je kunt nu deelnemen aan alle activiteiten. Ga naar de{' '}
                <a href="/activiteiten" className="text-geel underline">
                  activiteiten pagina
                </a>{' '}
                om je in te schrijven voor evenementen.
              </p>
            </div>
          ) : submitted ? (
            <div className="text-geel text-xl font-semibold">
              Bedankt voor je inschrijving! We nemen snel contact met je op.
            </div>
          ) : (
            <form
              className="flex text-start flex-col gap-4"
              onSubmit={handleSubmit}
            >
              {/* Voornaam */}
              <label className="font-semibold text-geel">
                Voornaam
                <input
                  type="text"
                  name="voornaam"
                  value={form.voornaam}
                  onChange={handleChange}
                  required
                  className="mt-1 p-2 rounded w-full bg-beige text-paars"
                />
              </label>

              {/* Tussenvoegsel */}
              <label className="font-semibold text-geel">
                Tussenvoegsel
                <input
                  type="text"
                  name="tussenvoegsel"
                  value={form.tussenvoegsel}
                  onChange={handleChange}
                  className="mt-1 p-2 rounded w-full bg-beige text-paars"
                />
              </label>

              {/* Achternaam */}
              <label className="font-semibold text-geel">
                Achternaam
                <input
                  type="text"
                  name="achternaam"
                  value={form.achternaam}
                  onChange={handleChange}
                  required
                  className="mt-1 p-2 rounded w-full bg-beige text-paars"
                />
              </label>

              {/* Email */}
              <label className="font-semibold text-geel">
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-1 p-2 rounded w-full bg-beige text-paars"
                />
              </label>

              {/* Geboortedatum */}
              <label className="font-semibold text-geel">Geboortedatum</label>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={nl}
              >
                <DatePicker
                  value={form.geboortedatum}
                  onChange={(newDate) =>
                    setForm({ ...form, geboortedatum: newDate })
                  }
                  slotProps={{
                    textField: {
                      className: 'mt-1 p-2 rounded w-full bg-beige text-paars',
                    },
                  }}
                />
              </LocalizationProvider>

              {/* Telefoonnummer */}
              <label className="font-semibold text-geel">
                Telefoonnummer
                <input
                  type="tel"
                  name="telefoon"
                  value={form.telefoon}
                  onChange={handleChange}
                  required
                  className="mt-1 p-2 rounded w-full bg-beige text-paars"
                />
              </label>

              <button
                type="submit"
                className="bg-oranje text-white font-bold py-2 px-4 rounded hover:bg-geel hover:text-paars transition mt-4"
              >
                Verstuur inschrijving
              </button>
            </form>
          )}
        </section>

        {/* Side Section */}
        <div className="w-full sm:w-1/2 flex flex-col gap-6">
          {/* Why join section */}
          <div className="w-full text-center bg-paars rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-geel mb-2">
              Waarom lid worden?
            </h2>
            <p className="text-lg mb-4 text-beige">
              Als lid van Salve Mundi krijg je toegang tot exclusieve
              activiteiten, workshops, borrels en nog veel meer! Word vandaag
              nog lid en ontdek de wereld van ICT samen met ons.
            </p>
          </div>

          {/* GIF Search Section */}
          <div className="w-full text-center bg-paars rounded-3xl p-6 flex flex-col">
            <label className="font-semibold text-geel mb-2">
              Favoriete GIF
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                placeholder="Zoek een GIF..."
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                className="p-2 rounded w-full bg-beige text-paars flex-1"
              />
              <button
                type="button"
                className="bg-oranje text-white font-bold py-2 px-4 rounded hover:bg-geel hover:text-paars transition"
                onClick={handleGifSearch}
              >
                Zoeken
              </button>
            </div>

            <div className="overflow-auto rounded-lg border border-oranje max-h-[50vh]">
              {!form.favorieteGif && gifs.length > 0 && (
                  <Grid
                  className="w-full"
                  width={Math.min(window.innerWidth * 0.9, 1200)}
                  columns={Math.floor(
                    Math.min(window.innerWidth * 0.9, 1200) / 150
                  )}
                  fetchGifs={() =>
                    Promise.resolve({
                      data: gifs,
                      pagination: {
                        total_count: gifs.length,
                        count: gifs.length,
                        offset: 0,
                      },
                      meta: { status: 200, msg: 'OK', response_id: '0' },
                    })
                  }
                  onGifClick={(gif, e) => {
                    e.preventDefault();
                    setForm({
                      ...form,
                      favorieteGif: gif.images.fixed_height.url,
                    });
                  }}
                />
              )}
            </div>

            {form.favorieteGif && (
              <div className="mt-2">
                <p className="text-beige">Geselecteerde GIF:</p>
                <img
                  src={form.favorieteGif}
                  alt="favoriete gif"
                  className="rounded-lg w-full h-auto cursor-pointer"
                  onClick={() => setForm({ ...form, favorieteGif: '' })} 
                />
                <p className="text-sm text-beige mt-1">
                  Klik op de GIF om een nieuwe te kiezen
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
        
        <Footer />
      </main>

      <BackToTopButton />
    </>
  );
}
