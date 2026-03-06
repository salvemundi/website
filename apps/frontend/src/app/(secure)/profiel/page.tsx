import type { Metadata } from 'next';
import Link from 'next/link';
import { User, CreditCard, Ticket, Plane, MapPin, Wallet, LayoutDashboard } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Profiel | SV Salve Mundi',
    description: 'Beheer je persoonlijke gegevens, bekijk je lidmaatschapsstatus en je gekochte tickets.',
};

export default function ProfielPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <header className="bg-[var(--bg-soft)] py-12">
                <div className="mx-auto max-w-app px-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-theme flex items-center justify-center text-[var(--text-main)] shadow-lg">
                            <LayoutDashboard size={28} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-main)]">Mijn Profiel</h1>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-app px-4 py-12">
                <div className="space-y-12">
                    {/* Persoonlijke Omgeving */}
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                            <User className="text-[var(--color-purple-300)]" />
                            Persoonlijke Omgeving
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Link href="/profiel/lidmaatschap" className="group p-6 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                                <CreditCard className="mb-4 text-[var(--color-purple-300)] transition-transform group-hover:scale-110" />
                                <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">Lidmaatschap</h3>
                                <p className="text-sm text-[var(--text-muted)]">Inzien en status van je lidmaatschap bekijken.</p>
                            </Link>

                            <Link href="/profiel/transacties" className="group p-6 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                                <Wallet className="mb-4 text-[var(--color-purple-300)] transition-transform group-hover:scale-110" />
                                <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">Betalingen</h3>
                                <p className="text-sm text-[var(--text-muted)]">Overzicht van al je Mollie transacties.</p>
                            </Link>

                            <Link href="/profiel/tickets" className="group p-6 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                                <Ticket className="mb-4 text-[var(--color-purple-300)] transition-transform group-hover:scale-110" />
                                <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">Tickets</h3>
                                <p className="text-sm text-[var(--text-muted)]">Je digitale portemonnee met QR-codes.</p>
                            </Link>
                        </div>
                    </section>

                    {/* De Studiereis */}
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                            <Plane className="text-[var(--color-purple-300)]" />
                            De Studiereis
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Link href="/reis/dashboard" className="group p-6 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                                <LayoutDashboard className="mb-4 text-[var(--color-purple-300)] transition-transform group-hover:scale-110" />
                                <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">Reis Dashboard</h3>
                                <p className="text-sm text-[var(--text-muted)]">Bekijk je status in de reis state-machine.</p>
                            </Link>

                            <Link href="/reis/activiteiten" className="group p-6 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                                <MapPin className="mb-4 text-[var(--color-purple-300)] transition-transform group-hover:scale-110" />
                                <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">Excursies</h3>
                                <p className="text-sm text-[var(--text-muted)]">Keuzemenu voor kamerindelingen en uitjes.</p>
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
