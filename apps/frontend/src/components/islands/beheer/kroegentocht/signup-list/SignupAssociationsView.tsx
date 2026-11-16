'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getAssociationStats, normalizeSearch, type KroegSignupLike } from '@/lib/utils/kroegentocht-signups';

interface SignupAssociationsViewProps {
    signups: KroegSignupLike[];
}

export default function SignupAssociationsView({ signups }: SignupAssociationsViewProps) {
    const [query, setQuery] = useState('');
    const stats = useMemo(() => getAssociationStats(signups), [signups]);
    const filtered = stats.filter((s) => normalizeSearch(s.association).includes(normalizeSearch(query)));
    const totals = stats.reduce((acc, s) => ({ signups: acc.signups + s.signups, participants: acc.participants + s.participants }), { signups: 0, participants: 0 });

    return (
        <div className="animate-in fade-in overflow-hidden rounded-2xl bg-(--bg-card) shadow-(--shadow-card) ring-1 ring-(--border-color)/30 duration-200">
            <div className="flex items-center gap-3 border-b border-(--border-color)/30 px-6 py-3">
                <Search className="size-4 shrink-0 text-(--text-muted)" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Zoek vereniging..."
                    autoComplete="off"
                    className="beheer-input w-full border-none bg-transparent p-0 text-sm text-(--text-main) outline-none placeholder:text-(--text-muted) focus:ring-0"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-(--border-color)/30 bg-(--bg-main)/50">
                            <th className="px-6 py-3 text-[10px] font-semibold text-(--text-muted)">Vereniging</th>
                            <th className="px-6 py-3 text-right text-[10px] font-semibold text-(--text-muted)">Personen</th>
                            <th className="px-6 py-3 text-right text-[10px] font-semibold text-(--text-muted)">Inschrijvingen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-color)/20">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-sm text-(--text-muted) italic">
                                    Geen verenigingen gevonden.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((s) => (
                                <tr key={s.association} className="hover:bg-(--bg-main)/30">
                                    <td className="px-6 py-2.5 text-sm font-semibold text-(--text-main)">{s.association}</td>
                                    <td className="px-6 py-2.5 text-right text-sm font-bold text-(--theme-purple) tabular-nums">{s.participants}</td>
                                    <td className="px-6 py-2.5 text-right text-sm text-(--text-muted) tabular-nums">{s.signups}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-(--border-color)/30 bg-(--bg-main)/50">
                            <td className="px-6 py-3 text-xs font-bold text-(--text-main)">Totaal ({stats.length} verenigingen)</td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-(--text-main) tabular-nums">{totals.participants}</td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-(--text-muted) tabular-nums">{totals.signups}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
