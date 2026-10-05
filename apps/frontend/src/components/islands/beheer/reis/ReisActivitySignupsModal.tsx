'use client';

import {
    Users,
    X,
    Loader2
} from 'lucide-react';

import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions } from '@/lib/reis';

export interface Signup {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    trip_signup_id: number | null;
    selected_options?: unknown;
}

interface Props {
    activityName: string;
    options?: unknown;
    signups: Signup[];
    loading: boolean;
    onClose: () => void;
}

export default function ReisActivitySignupsModal({ activityName, options, signups, loading, onClose }: Props) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content max-w-4xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex-between border-b p-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3 text-beheer-text">
                            <div className="icon-box">
                                <Users className="size-6" />
                            </div>
                            Inschrijvingen
                        </h2>
                        <p className="ml-14 text-2xs font-semibold text-beheer-text-muted/60">{activityName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="icon-button beheer-button-secondary"
                        type="button">
                        <X className="size-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex-col-center py-24">
                            <Loader2 className="mb-4 size-12 animate-spin text-beheer-accent/50" />
                            <p className="text-2xs font-semibold text-beheer-text-muted">Data laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="py-24 text-center">
                            <Users className="mx-auto size-10 text-beheer-text-muted/20" />
                            <p className="mt-4 text-sm font-semibold text-beheer-text-muted">Nog geen inschrijvingen voor deze activiteit.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-3xl border border-beheer-border/50">
                            <table className="w-full text-left">
                                <thead className="border-b border-beheer-border bg-beheer-card-soft/50">
                                    <tr className="text-2xs font-semibold text-beheer-text-muted">
                                        <th className="px-8 py-5">Reiziger</th>
                                        <th className="px-8 py-5">Contact</th>
                                        <th className="px-8 py-5">Gekozen Opties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-beheer-border/10">
                                    {signups.map((s) => {
                                        const travelerName = `${s.first_name} ${s.last_name}`.trim() || 'Onbekende reiziger';
                                        const travelerEmail = s.email || '-';

                                        return (
                                            <tr key={s.id} className="hover:bg-beheer-accent/2">
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-semibold text-beheer-text">
                                                        {travelerName}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-xs text-beheer-text-muted">{travelerEmail}</td>
                                            <td className="px-8 py-6">
                                                {(() => {
                                                    const rawSelected = parseSelectedOptions(s.selected_options);
                                                    const metaOptions = parseActivityOptions(options);
                                                    const selectedIds = Object.entries(rawSelected)
                                                        .filter(([, isSelected]) => isSelected)
                                                        .map(([id]) => id);
                                                    if (selectedIds.length === 0) {
                                                        return <span className="text-2xs text-beheer-text-muted/40 italic">Geen opties</span>;
                                                    }

                                                    return (
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedIds.map((optId, i) => (
                                                                <span key={i} className="badge">
                                                                    {mapActivityOptionIdToName(optId, metaOptions)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                                <tfoot className="border-t border-beheer-border/50 bg-beheer-card-soft/20">
                                    <tr>
                                        <td colSpan={3} className="px-8 py-5 text-2xs text-beheer-text-muted/60">
                                            Totaal: {signups.length} {signups.length === 1 ? 'aanmelding' : 'aanmeldingen'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t p-8">
                    <button
                        onClick={onClose}
                        className="beheer-button-secondary"
                        type="button">
                        Venster Sluiten
                    </button>
                </div>
            </div>
        </div>
    );
}
