import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, History, LayoutGrid, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export const metadata: Metadata = {
    title: 'Vereniging | SV Salve Mundi',
    description: 'Ontdek meer over SV Salve Mundi: onze commissies, het bestuur en de rijke historie van onze vereniging.',
};

export default function VerenigingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader
                title="DE VERENIGING"
                backgroundImage="/img/backgrounds/homepage-banner.jpg"
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
                description="Salve Mundi is meer dan een studievereniging. Wij zijn een community van studenten die samen groeien, leren en plezier maken."
            />

            <main className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Bestuur Sectie (Static Placeholder for now) */}
                    <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-purple-300)]/10 text-[var(--color-purple-300)] flex items-center justify-center mb-6">
                            <Users strokeWidth={1.5} size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-3">Huidig Bestuur</h2>
                        <p className="text-[var(--text-muted)] mb-6 flex-grow">
                            Maak kennis met de studenten die dit jaar de koers van Salve Mundi bepalen en de vereniging draaiende houden.
                        </p>
                        <button className="w-full py-3 rounded-full border-2 border-[var(--color-purple-100)] text-[var(--text-main)] font-semibold opacity-50 cursor-not-allowed">
                            Binnenkort beschikbaar
                        </button>
                    </div>

                    {/* Commissies Sectie (Static Placeholder for now) */}
                    <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-purple-300)]/10 text-[var(--color-purple-300)] flex items-center justify-center mb-6">
                            <LayoutGrid strokeWidth={1.5} size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-3">Commissies</h2>
                        <p className="text-[var(--text-muted)] mb-6 flex-grow">
                            Van techniek tot uitjes en van reis tot redactie. Ontdek de 10+ commissies waar jij actief kunt worden.
                        </p>
                        <button className="w-full py-3 rounded-full border-2 border-[var(--color-purple-100)] text-[var(--text-main)] font-semibold opacity-50 cursor-not-allowed">
                            Binnenkort beschikbaar
                        </button>
                    </div>

                    {/* Historie / Oud-besturen Link */}
                    <Link
                        href="/vereniging/oud-besturen"
                        className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8 flex flex-col items-center text-center group transition-all hover:-translate-y-1 hover:shadow-xl border-2 border-transparent hover:border-[var(--color-purple-300)]/20"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-purple-300)]/10 text-[var(--color-purple-300)] flex items-center justify-center mb-6 transition-colors group-hover:bg-gradient-theme group-hover:text-[var(--text-main)]">
                            <History strokeWidth={1.5} size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-3">Hall of Fame</h2>
                        <p className="text-[var(--text-muted)] mb-6 flex-grow">
                            Onze geschiedenis in beeld. Bekijk alle oud-besturen en gedenkwaardige jaren uit het verleden van Salve Mundi.
                        </p>
                        <div className="w-full py-3 rounded-full bg-[var(--bg-soft)] text-[var(--text-main)] font-semibold flex items-center justify-center gap-2">
                            Bekijk historie <ChevronRight size={18} />
                        </div>
                    </Link>

                </div>
            </main>
        </div>
    );
}
