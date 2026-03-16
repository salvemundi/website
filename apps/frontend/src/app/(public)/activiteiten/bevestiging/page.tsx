import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CheckCircle2, QrCode, Calendar, MapPin, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/ui/layout/PageHeader';
import QRDisplay from '@/shared/ui/QRDisplay';

interface PageProps {
    searchParams: Promise<{ id: string }>;
}

async function ConfirmationData({ id }: { id: string }) {
    // In a real V7 app, we would fetch the signup status from Directus
    // For now, we'll show a generic success state with the ID
    
    return (
        <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-12">
            <div className="space-y-4">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner ring-1 ring-green-500/10">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-[var(--theme-purple)]">Inschrijving Bevestigd!</h1>
                <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                    Je bent succesvol aangemeld. We hebben je ticket en bevestiging naar je e-mailadres gestuurd.
                </p>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl shadow-[var(--theme-purple)]/5 space-y-8">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-xs font-black text-[var(--theme-purple)]/40 uppercase tracking-widest">Jouw Digitale Ticket</p>
                    <div className="p-4 bg-white rounded-3xl shadow-inner border border-[var(--border-color)]">
                        {/* Simplified QR Placeholder if QRDisplay is missing */}
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-2xl">
                             <QrCode className="h-24 w-24 text-[var(--theme-purple)] opacity-20" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-8 border-t border-[var(--border-color)]/50">
                    <div className="p-4 rounded-2xl bg-[var(--bg-soft)]">
                        <p className="text-[10px] font-black text-[var(--theme-purple)]/40 uppercase tracking-widest mb-1">Referentie</p>
                        <p className="font-bold text-[var(--theme-purple)]">#{id}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--bg-soft)]">
                        <p className="text-[10px] font-black text-[var(--theme-purple)]/40 uppercase tracking-widest mb-1">Type</p>
                        <p className="font-bold text-[var(--theme-purple)]">Standaard Ticket</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <a 
                    href="/activiteiten" 
                    className="h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-black flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20"
                >
                    TERUG NAAR ACTIVITEITEN
                </a>
                <a 
                    href="/profiel" 
                    className="h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--theme-purple)] font-black flex items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-all"
                >
                    BEKIJK MIJN ACTIVITEITEN
                </a>
            </div>
        </div>
    );
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
    const { id } = await searchParams;

    if (!id) notFound();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="BEVESTIGING"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                variant="centered"
                contentPadding="py-16"
            />
            <Suspense fallback={<div className="p-20 text-center animate-pulse text-[var(--theme-purple)] font-black">BEVESTIGING LADEN...</div>}>
                <ConfirmationData id={id} />
            </Suspense>
        </main>
    );
}
