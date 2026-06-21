import React from 'react';
import { Search, Home, CheckCircle2 } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

/**
 * UI for when a payment link is invalid or expired.
 */
export function TripAccessDenied({ error }: { error?: string }) {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8 pt-10">
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-purple-500/10 rounded-full pointer-events-none" />
                <div className="relative squircle-lg bg-(--bg-card) p-6 shadow-2xl border border-(--border-color)/20 text-purple-500 inline-block">
                    <Search className="h-16 w-16" />
                </div>
            </div>

            <h2 className="text-4xl font-black text-(--text-main) mb-3 tracking-tight italic uppercase">
                Toegang Geweigerd
            </h2>
            
            <p className="text-(--text-muted) max-w-md mx-auto mb-10 font-medium">
                {error || 'Deze link is ongeldig of verlopen. Gebruik de link uit de e-mail of log in op je account.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
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

/**
 * UI for when a user is still on the waitlist.
 */
export function TripWaitlisted() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8 pt-10">
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-amber-500/10 rounded-full pointer-events-none" />
                <div className="relative squircle-lg bg-(--bg-card) p-6 shadow-2xl border border-(--border-color)/20 text-amber-500 inline-block">
                    <Search className="h-16 w-16" />
                </div>
            </div>

            <h2 className="text-4xl font-black text-(--text-main) mb-3 tracking-tight italic uppercase">
                Wachtlijst
            </h2>
            
            <p className="text-(--text-muted) max-w-md mx-auto mb-10 font-medium text-balance">
                Je staat momenteel op de wachtlijst voor deze reis. Je kunt pas betalen zodra er een plek vrijkomt en je status is aangepast naar &apos;Geregistreerd&apos;.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
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

/**
 * UI for when a trip is already fully paid.
 */
export function TripAlreadyPaid({ tripName }: { tripName: string }) {
    return (
        <div className="max-w-xl mx-auto py-32 px-6 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic mb-4">Betaling voltooid</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
                Je hebt de volledige betaling voor de reis naar <strong>{tripName}</strong> al voldaan. 
                Je hoeft verder niets te doen! Je hoort binnenkort meer van ons.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <BackButton href="/reis" text="Terug naar Reizen" />
                <a href="/profiel/lidmaatschap" className="px-8 py-4 bg-orange-500 text-white font-bold squircle shadow-xl shadow-orange-500/10 transition-all">
                    Bekijk je profiel
                </a>
            </div>
        </div>
    );
}
