'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import PageHeader from '@/shared/components/ui/PageHeader';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { nl } from 'date-fns/locale';
import { sendMembershipSignupEmail } from '@/lib/services/email-service';

const DeletionTimer = ({ expiryDateStr }: { expiryDateStr: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number } | null>(null);

    useEffect(() => {
        if (!expiryDateStr) return;

        const expiryDate = new Date(expiryDateStr);
        const deletionDate = new Date(expiryDate);
        deletionDate.setFullYear(deletionDate.getFullYear() + 2);

        const timer = setInterval(() => {
            const now = new Date();
            const difference = deletionDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
                clearInterval(timer);
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                setTimeLeft({ days, hours, minutes });
            }
        }, 60000);

        return () => clearInterval(timer);
    }, [expiryDateStr]);

    if (!timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0)) return null;

    return (
        <div className="bg-paars/10 rounded-lg p-4 mb-6 text-center">
            <p className="text-paars font-bold uppercase text-sm mb-1">⚠️ Account Verwijdering (AVG)</p>
            <p className="text-beige text-sm mb-2">
                Je lidmaatschap is verlopen. Als je niet verlengt, worden je gegevens permanent verwijderd over:
            </p>
            <div className="text-2xl font-mono font-bold text-oranje">
                {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m
            </div>
        </div>
    );
};

export default function SignUp() {
    const { user } = useAuth();

    const [form, setForm] = useState({
        voornaam: '',
        tussenvoegsel: '',
        achternaam: '',
        email: '',
        geboortedatum: null as Date | null,
        telefoon: '',
    });

    const [isProcessing, setIsProcessing] = useState(false);

    const isGuest = !user;
    const isValidMember = user && user.is_member;
    const isExpired = user && !user.is_member;

    let pageTitle = "WORD LID!";
    let formTitle = "Inschrijfformulier";

    if (isValidMember) {
        pageTitle = "MIJN LIDMAATSCHAP";
        formTitle = "Huidige Status";
    } else if (isExpired) {
        pageTitle = "LIDMAATSCHAP VERLENGEN";
        formTitle = "Verlengen";
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const initiateContributionPayment = async () => {
        try {
            const payload = {
                amount: '20.00',
                description: 'Contributie Salve Mundi',
                redirectUrl: window.location.origin + '/account',
                isContribution: true,
                userId: user ? user.id : null,
                firstName: user ? undefined : form.voornaam,
                lastName: user ? undefined : form.achternaam,
                email: user ? user.email : form.email,
            };

            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                console.error('Payment creation failed:', data.error);
                alert('Er ging iets mis bij het aanmaken van de betaling. Probeer het later opnieuw.');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            alert('Er ging iets mis bij de verbinding voor de betaling.');
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        if (isGuest) {
            sendMembershipSignupEmail({
                recipientEmail: form.email,
                firstName: form.voornaam,
                lastName: form.achternaam,
                phoneNumber: form.telefoon,
                dateOfBirth: form.geboortedatum ? form.geboortedatum.toLocaleDateString('nl-NL') : undefined,
            }).catch((err) => {
                console.warn('Failed to send membership signup email:', err);
            });
        }

        await initiateContributionPayment();
    };

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
                <PageHeader
                    title={pageTitle}
                    backgroundImage="/img/placeholder.svg"
                />
            </div>

            <main className="">
                <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-10">
                    <section className="w-full sm:w-1/2 bg-paars rounded-3xl shadow-lg p-6 sm:p-8">
                        <h1 className="text-3xl font-bold text-geel mb-6">
                            {formTitle}
                        </h1>

                        {isValidMember && (
                            <div className="text-beige">
                                <div className="bg-green-500/20 p-4 rounded-lg mb-6">
                                    <p className="font-bold text-green-400 text-lg mb-1">✓ Actief Lid</p>
                                    <p className="text-sm">Je bent een volwaardig lid van Salve Mundi.</p>
                                </div>

                                <p className="mb-4 text-lg">
                                    Welkom terug, <span className="font-bold text-geel">{user.first_name}</span>!
                                </p>

                                <div className="bg-white/10 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-geel font-semibold uppercase tracking-wide">Jouw gegevens</p>
                                    <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                                    <p className="text-white/80 text-sm">{user.email}</p>
                                    {user.membership_expiry && (
                                        <p className="text-white/60 text-xs mt-2">
                                            Geldig tot: {new Date(user.membership_expiry).toLocaleDateString('nl-NL')}
                                        </p>
                                    )}
                                </div>

                                <p className="text-sm text-beige/60 italic">
                                    Je hoeft op dit moment geen actie te ondernemen.
                                </p>
                            </div>
                        )}

                        {isExpired && (
                            <div className="text-beige">
                                {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

                                <p className="mb-4 text-lg">
                                    Welkom terug, <span className="font-bold text-geel">{user.first_name}</span>.
                                </p>
                                <p className="mb-6">
                                    Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                                </p>

                                <button
                                    onClick={() => { setIsProcessing(true); initiateContributionPayment(); }}
                                    disabled={isProcessing}
                                    className="w-full bg-gradient-to-r from-oranje to-paars text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Verwerken...' : 'Nu Verlengen (€20,00)'}
                                </button>
                            </div>
                        )}

                        {isGuest && (
                            <form className="flex text-start flex-col gap-4" onSubmit={handleSubmit}>
                                <p className="text-beige mb-2">Vul je gegevens in om een account aan te maken en lid te worden.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="font-semibold text-geel">
                                        Voornaam
                                        <input type="text" name="voornaam" value={form.voornaam} onChange={handleChange} required className="mt-1 p-2 rounded w-full bg-beige text-paars" />
                                    </label>
                                    <label className="font-semibold text-geel">
                                        Achternaam
                                        <input type="text" name="achternaam" value={form.achternaam} onChange={handleChange} required className="mt-1 p-2 rounded w-full bg-beige text-paars" />
                                    </label>
                                </div>

                                <label className="font-semibold text-geel">
                                    E-mail
                                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-1 p-2 rounded w-full bg-beige text-paars" />
                                </label>

                                <label className="font-semibold text-geel">Geboortedatum</label>
                                <div className="w-full">
                                    <DatePicker
                                        selected={form.geboortedatum}
                                        onChange={(date) => setForm({ ...form, geboortedatum: date })}
                                        dateFormat="dd-MM-yyyy"
                                        locale={nl}
                                        className="mt-1 p-2 rounded w-full bg-beige text-paars"
                                        placeholderText="Selecteer datum"
                                        showYearDropdown
                                        scrollableYearDropdown
                                        yearDropdownItemNumber={100}
                                    />
                                </div>

                                <label className="font-semibold text-geel">
                                    Telefoonnummer
                                    <input type="tel" name="telefoon" value={form.telefoon} onChange={handleChange} required className="mt-1 p-2 rounded w-full bg-beige text-paars" />
                                </label>

                                <button type="submit" disabled={isProcessing} className="bg-gradient-to-r from-oranje to-paars text-white font-bold py-2 px-4 rounded shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isProcessing ? 'Verwerken...' : 'Betalen en Inschrijven (€20,00)'}
                                </button>
                            </form>
                        )}
                    </section>

                    <div className="w-full sm:w-1/2 flex flex-col gap-6">
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
        </>
    );
}
