'use client';

import React from 'react';
import { 
    Users, 
    X, 
    Loader2 
} from 'lucide-react';

interface Signup {
    id: number;
    trip_signup_id?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    selected_options?: string[];
}

interface Props {
    activityName: string;
    signups: Signup[];
    loading: boolean;
    onClose: () => void;
}

export default function TripActivitySignupsModal({ activityName, signups, loading, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--beheer-card-bg)] w-full max-w-4xl rounded-[var(--beheer-radius)] shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-[var(--beheer-border)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-[var(--beheer-border)] flex items-center justify-between">
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-[var(--beheer-accent)]/10 rounded-xl text-[var(--beheer-accent)]">
                                <Users className="h-6 w-6" />
                            </div>
                            Inschrijvingen
                        </h2>
                        <p className="text-[10px] font-black uppercase text-[var(--beheer-text-muted)] tracking-[0.2em] opacity-60 ml-12">{activityName}</p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-[var(--beheer-card-soft)] rounded-[var(--beheer-radius)] transition-all group">
                        <X className="h-6 w-6 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin h-12 w-12 text-[var(--beheer-accent)] mb-4" />
                            <p className="text-[10px] font-black tracking-widest uppercase text-[var(--beheer-text-muted)]">Data laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="h-20 w-20 bg-[var(--beheer-card-soft)]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-[var(--beheer-text-muted)] opacity-20" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Nog geen inschrijvingen voor deze activiteit.</p>
                        </div>
                    ) : (
                        <div className="border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                        <th className="px-8 py-5">Deelnemer</th>
                                        <th className="px-8 py-5">Email</th>
                                        <th className="px-8 py-5">Gekozen Opties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--beheer-border)]">
                                    {signups.map((s) => (
                                        <tr key={s.id} className="hover:bg-[var(--beheer-card-soft)]/30 transition-colors">
                                            <td className="px-8 py-6 font-black text-xs uppercase tracking-tight text-[var(--beheer-text)]">
                                                {s.trip_signup_id ? `${s.trip_signup_id.first_name} ${s.trip_signup_id.last_name}` : 'Onbekend'}
                                            </td>
                                            <td className="px-8 py-6 text-xs text-[var(--beheer-text-muted)] font-medium lowercase">{s.trip_signup_id?.email || '-'}</td>
                                            <td className="px-8 py-6">
                                                {Array.isArray(s.selected_options) && s.selected_options.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {s.selected_options.map((opt: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] text-[9px] font-black uppercase tracking-tighter rounded-lg border border-[var(--beheer-accent)]/10">
                                                                {opt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--beheer-text-muted)] italic text-xs opacity-40">Geen opties</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[var(--beheer-card-soft)]/30 border-t border-[var(--beheer-border)]">
                                    <tr>
                                        <td colSpan={3} className="px-8 py-5 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-[0.2em] opacity-40">
                                            Totaal: {signups.length} {signups.length === 1 ? 'aanmelding' : 'aanmeldingen'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-12 py-4 bg-[var(--beheer-text)] text-[var(--beheer-card-bg)] rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:opacity-90 active:scale-95"
                    >
                        Sluiten
                    </button>
                </div>
            </div>
        </div>
    );
}
