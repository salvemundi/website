'use client';

import React from 'react';
import {
    Users,
    X,
    Loader2
} from 'lucide-react';

import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions, type ActivityOption } from '@/lib/reis';

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
    options?: ActivityOption[] | string | null;
    signups: Signup[];
    loading: boolean;
    onClose: () => void;
}

export default function ReisActivitySignupsModal({ activityName, options, signups, loading, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-4xl border border-(--beheer-border)/50 bg-(--beheer-card-bg)/90 shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-(--beheer-border) p-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-(--beheer-text)">
                            <div className="rounded-xl bg-(--beheer-accent)/10 p-2.5 text-(--beheer-accent)">
                                <Users className="size-6" />
                            </div>
                            Inschrijvingen
                        </h2>
                        <p className="ml-14 text-[10px] font-semibold text-(--beheer-text-muted) opacity-60">{activityName}</p>
                    </div>
                    <button onClick={onClose} className="group icon-button rounded-2xl bg-(--beheer-card-soft) p-4 text-(--beheer-text-muted) transition-all hover:bg-(--beheer-card-soft)/80 hover:text-(--beheer-text) active:scale-90">
                        <X className="size-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="mb-4 size-12 animate-spin text-(--beheer-accent) opacity-50" />
                            <p className="text-[10px] font-semibold text-(--beheer-text-muted)">Data laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-(--beheer-border)/20 bg-(--bg-main)/30 py-24 text-center">
                            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-(--beheer-card-soft)/50">
                                <Users className="size-10 text-(--beheer-text-muted) opacity-20" />
                            </div>
                            <p className="text-sm font-semibold tracking-tight text-(--beheer-text-muted)">Nog geen inschrijvingen voor deze activiteit.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-3xl border border-(--beheer-border)/50 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="border-b border-(--beheer-border) bg-(--beheer-card-soft)/50">
                                    <tr className="text-[10px] font-semibold text-(--beheer-text-muted)">
                                        <th className="px-8 py-5">Reiziger</th>
                                        <th className="px-8 py-5">Contact</th>
                                        <th className="px-8 py-5">Gekozen Opties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--beheer-border)/10">
                                    {signups.map((s) => (
                                        <tr key={s.id} className="transition-colors hover:bg-(--beheer-accent)/2">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-semibold tracking-tight text-(--beheer-text)">
                                                    {s.trip_signup_id ? `${s.trip_signup_id.first_name} ${s.trip_signup_id.last_name}` : 'Onbekend'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-medium text-(--beheer-text-muted) lowercase">{s.trip_signup_id?.email || '-'}</td>
                                            <td className="px-8 py-6">
                                                {(() => {
                                                    const rawSelected = parseSelectedOptions(s.selected_options);
                                                    const metaOptions = parseActivityOptions(options);
                                                    const selectedIds = Object.entries(rawSelected)
                                                        .filter(([, isSelected]) => isSelected)
                                                        .map(([id]) => id);
                                                    if (selectedIds.length === 0) {
                                                        return <span className="text-[10px] text-(--beheer-text-muted) italic opacity-40">Geen opties</span>;
                                                    }

                                                    return (
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedIds.map((optId, i) => (
                                                                <span key={i} className="rounded-lg border border-(--beheer-accent)/10 bg-(--beheer-accent)/5 px-3 py-1 text-[9px] font-semibold tracking-tight text-(--beheer-accent)">
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
                                <tfoot className="border-t border-(--beheer-border)/50 bg-(--beheer-card-soft)/20">
                                    <tr>
                                        <td colSpan={3} className="px-8 py-5 text-[10px] font-semibold text-(--beheer-text-muted) opacity-60">
                                            Totaal: {signups.length} {signups.length === 1 ? 'aanmelding' : 'aanmeldingen'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-(--beheer-border)/50 bg-(--beheer-card-soft)/20 p-8">
                    <button
                        onClick={onClose}
                        className="beheer-button rounded-xl border border-white/10 bg-(--beheer-accent) px-10 py-4 text-[10px] font-semibold text-white shadow-xl transition-all hover:opacity-90 active:scale-95"
                    >
                        Venster Sluiten
                    </button>
                </div>
            </div>
        </div>
    );
}
