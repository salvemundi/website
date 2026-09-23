import React from 'react';
import { Search, Home, CheckCircle2 } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

export function TripAccessDenied({ error }: { error?: string }) {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8 pt-10">
                <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="squircle-lg relative inline-block border border-(--border-color)/20 bg-(--bg-card) p-6 text-purple-500 shadow-2xl">
                    <Search className="size-16" />
                </div>
            </div>

            <h2 className="mb-3 text-4xl font-black tracking-tight text-(--text-main) uppercase italic">
                Toegang Geweigerd
            </h2>
            
            <p className="mx-auto mb-10 max-w-md font-medium text-(--text-muted)">
                {error || 'Deze link is ongeldig of verlopen. Gebruik de link uit de e-mail of log in op je account.'}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <BackButton 
                    href="/reis" 
                    text="Terug naar Reizen" 
                    icon={Home} 
                    className="squircle px-8 py-3.5"
                />
            </div>
        </div>
    );
}

export function TripWaitlisted() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8 pt-10">
                <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="squircle-lg relative inline-block border border-(--border-color)/20 bg-(--bg-card) p-6 text-amber-500 shadow-2xl">
                    <Search className="size-16" />
                </div>
            </div>

            <h2 className="mb-3 text-4xl font-black tracking-tight text-(--text-main) uppercase italic">
                Wachtlijst
            </h2>
            
            <p className="mx-auto mb-10 max-w-md font-medium text-balance text-(--text-muted)">
                Je staat momenteel op de wachtlijst voor deze reis. Je kunt pas betalen zodra er een plek vrijkomt en je status is aangepast naar &apos;Geregistreerd&apos;.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <BackButton 
                    href="/reis" 
                    text="Terug naar Reizen" 
                    icon={Home} 
                    className="squircle px-8 py-3.5"
                />
            </div>
        </div>
    );
}

export function TripAlreadyPaid({ tripName }: { tripName: string }) {
    return (
        <div className="mx-auto max-w-xl px-6 py-32 text-center">
            <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <CheckCircle2 className="size-10" />
            </div>
            <h1 className="mb-4 text-4xl font-black text-white uppercase italic">Betaling voltooid</h1>
            <p className="mb-8 leading-relaxed text-gray-400">
                Je hebt de volledige betaling voor de reis naar <strong>{tripName}</strong> al voldaan. 
                Je hoeft verder niets te doen! Je hoort binnenkort meer van ons.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <BackButton href="/reis" text="Terug naar Reizen" />
                <a href="/lidmaatschap" className="squircle bg-orange-500 px-8 py-4 font-bold text-white shadow-xl shadow-orange-500/10 transition-all">
                    Bekijk je lidmaatschap
                </a>
            </div>
        </div>
    );
}
