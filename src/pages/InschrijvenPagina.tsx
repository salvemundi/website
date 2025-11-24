// src/pages/InschrijvenPagina.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { nl } from 'date-fns/locale';
import { sendMembershipSignupEmail } from '../lib/email-service';

export default function SignUp() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    voornaam: user?.first_name || '',
    tussenvoegsel: '',
    achternaam: user?.last_name || '',
    email: user?.email || '',
    geboortedatum: null as Date | null,
    telefoon: user?.phone_number || '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send email notification (don't wait for it to complete)
    sendMembershipSignupEmail({
      recipientEmail: form.email,
      firstName: form.voornaam,
      lastName: form.achternaam,
      phoneNumber: form.telefoon,
      dateOfBirth: form.geboortedatum ? form.geboortedatum.toLocaleDateString('nl-NL') : undefined,
    }).catch(err => {
      // Log but don't fail the signup
      console.warn('Failed to send membership signup email:', err);
    });

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

  return (
    <>
      <div className="flex flex-col w-full">
        <Header
          title="WORD LID!"
          backgroundImage="/img/placeholder.svg"
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

          </div>
        </div>

      </main>

      <BackToTopButton />
    </>
  );
}
