'use client';

import React from 'react';
import { 
    Users, 
    X, 
    Loader2 
} from 'lucide-react';

import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions } from '@/lib/reis';

export interface Signup {
    id: number;
    trip_signup_id?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    selected_options?: string | Record<string, boolean> | string[];
}

interface Props {
    activityName: string;
    options?: any;
    signups: Signup[];
    loading: boolean;
    onClose: () => void;
}

export default function TripActivitySignupsModal({ activityName, options, signups, loading, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-[var(--beheer-card-bg)]/90 backdrop-blur-xl w-full max-w-4xl rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-[var(--beheer-border)]/50 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-[var(--beheer-border)] flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-[var(--beheer-text)] tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-[var(--beheer-accent)]/10 rounded-xl text-[var(--beheer-accent)]">
                                <Users className="h-6 w-6" />
                            </div>
                            Inschrijvingen
                        </h2>
                        <p className="text-[10px] font-semibold uppercase text-[var(--beheer-text-muted)] tracking-widest opacity-60 ml-14">{activityName}</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-[var(--beheer-card-soft)] hover:bg-[var(--beheer-card-soft)]/80 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-all rounded-2xl active:scale-90 group">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="animate-spin h-12 w-12 text-[var(--beheer-accent)] mb-4 opacity-50" />
                            <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--beheer-text-muted)]">Data laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="text-center py-24 bg-[var(--bg-main)]/30 rounded-3xl border-2 border-dashed border-[var(--beheer-border)]/20">
                            <div className="h-20 w-20 bg-[var(--beheer-card-soft)]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-[var(--beheer-text-muted)] opacity-20" />
                            </div>
                            <p className="text-sm font-semibold tracking-tight text-[var(--beheer-text-muted)]">Nog geen inschrijvingen voor deze activiteit.</p>
                        </div>
                    ) : (
                        <div className="border border-[var(--beheer-border)]/50 rounded-3xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]">
                                    <tr className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--beheer-text-muted)]">
                                        <th className="px-8 py-5">Reiziger</th>
                                        <th className="px-8 py-5">Contact</th>
                                        <th className="px-8 py-5">Gekozen Opties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--beheer-border)]/10">
                                    {signups.map((s) => (
                                        <tr key={s.id} className="hover:bg-[var(--beheer-accent)]/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-semibold text-[var(--beheer-text)] tracking-tight">
                                                    {s.trip_signup_id ? `${s.trip_signup_id.first_name} ${s.trip_signup_id.last_name}` : 'Onbekend'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-[var(--beheer-text-muted)] font-medium lowercase">{s.trip_signup_id?.email || '-'}</td>
                                            <td className="px-8 py-6">
                                                {(() => {
                                                    const rawSelected = parseSelectedOptions(s.selected_options);
                                                    const metaOptions = parseActivityOptions(options);
                                                    const selectedIds = Object.keys(rawSelected).filter(id => rawSelected[id]);
                                                    
                                                    if (selectedIds.length === 0) {
                                                        return <span className="text-[var(--beheer-text-muted)] italic text-[10px] opacity-40">Geen opties</span>;
                                                    }

                                                    return (
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedIds.map((optId, i) => (
                                                                <span key={i} className="px-3 py-1 bg-[var(--beheer-accent)]/5 text-[var(--beheer-accent)] text-[9px] font-semibold tracking-tight rounded-lg border border-[var(--beheer-accent)]/10">
                                                                    {mapActivityOptionIdToName(optId, metaOptions)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[var(--beheer-card-soft)]/20 border-t border-[var(--beheer-border)]/50">
                                    <tr>
                                        <td colSpan={3} className="px-8 py-5 text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">
                                            Totaal: {signups.length} {signups.length === 1 ? 'aanmelding' : 'aanmeldingen'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-[var(--beheer-border)]/50 bg-[var(--beheer-card-soft)]/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-[var(--beheer-accent)] text-white rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl transition-all hover:opacity-90 active:scale-95 border border-white/10"
                    >
                        Venster Sluiten
                    </button>
                </div>
            </div>
        </div>
    );
}
