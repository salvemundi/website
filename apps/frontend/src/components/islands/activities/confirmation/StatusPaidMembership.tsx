'use client';

import { UserPlus } from 'lucide-react';

export default function StatusPaidMembership() {
    return (
        <div className="space-y-12 animate-in zoom-in-95 duration-500 text-center">
            <div className="space-y-4">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                    <UserPlus className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold text-[var(--text-main)] tracking-tighter italic leading-none">
                    Welkom <span className="text-green-500">lid!</span>
                </h1>
                <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                    Je betaling is geslaagd. Je bent nu officieel lid van SV Salve Mundi!
                </p>
            </div>

            <div className="max-w-md mx-auto p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl space-y-6">
                <p className="text-base font-medium text-[var(--text-main)] leading-relaxed">
                    Je hebt zojuist een bevestigingsmail ontvangen met alle details.
                    Je kunt nu inloggen op de website om gebruik te maken van je ledenvoordelen.
                </p>
                <a href="/profiel" className="w-full h-14 rounded-2xl bg-[var(--theme-purple)] text-white font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20">
                    Naar mijn profiel
                </a>
            </div>
        </div>
    );
}
