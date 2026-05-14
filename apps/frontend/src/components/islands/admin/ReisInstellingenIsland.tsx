'use client';

import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface ReisInstellingenIslandProps {
    initialTrips: Trip[];
    initialSettings: {
        id?: string;
        show: boolean;
        disabled_message?: string | null;
    };
}

export default function ReisInstellingenIsland({
    initialTrips,
    initialSettings
}: ReisInstellingenIslandProps) {
    return (
        <div className="w-full space-y-8">
            <div className="bg-[var(--beheer-card-bg)] rounded-3xl border border-[var(--beheer-border)] p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--beheer-text)] mb-4 tracking-tight">
                    Reis <span className="text-[var(--beheer-accent)]">Instellingen</span>
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)]/50">
                        <span className="text-base font-semibold text-[var(--beheer-text-muted)]">Module Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${initialSettings.show ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {initialSettings.show ? 'Actief' : 'Uitgeschakeld'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)]/50">
                        <span className="text-base font-semibold text-[var(--beheer-text-muted)]">Geregistreerde Reizen</span>
                        <span className="text-lg font-semibold text-[var(--beheer-text)]">{initialTrips.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}