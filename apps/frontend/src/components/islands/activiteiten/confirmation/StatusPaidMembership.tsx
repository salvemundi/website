'use client';

import { UserPlus } from 'lucide-react';

export default function StatusPaidMembership() {
    return (
        <div className="animate-in zoom-in-95 space-y-12 text-center duration-500">
            <div className="space-y-4">
                <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                    <UserPlus className="size-12 text-green-500" />
                </div>
                <h1 className="text-4xl leading-none font-semibold tracking-tighter text-(--text-main) italic md:text-6xl">
                    Welkom <span className="text-green-500">lid!</span>
                </h1>
                <p className="mx-auto max-w-md text-lg font-medium text-(--text-muted)">
                    Je betaling is geslaagd. Je bent nu officieel lid van SV Salve Mundi!
                </p>
            </div>

            <div className="mx-auto max-w-md space-y-6 rounded-[3rem] border border-(--border-color) bg-(--bg-card) p-8 shadow-2xl">
                <p className="text-base leading-relaxed font-medium text-(--text-main)">
                    Je hebt zojuist een bevestigingsmail ontvangen met alle details.
                    Je kunt nu inloggen op de website om gebruik te maken van je ledenvoordelen.
                </p>
                <a href="/profiel" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-(--theme-purple) font-semibold text-white shadow-(--theme-purple)/20 shadow-xl transition-all hover:scale-105">
                    Naar mijn profiel
                </a>
            </div>
        </div>
    );
}
