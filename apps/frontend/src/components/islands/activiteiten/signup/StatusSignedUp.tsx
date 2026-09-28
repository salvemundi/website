'use client';

import React from 'react';
import { CheckCircle2, CreditCard, AlertCircle, Ticket } from 'lucide-react';
import QRDisplay from '@/shared/ui/QRDisplay';

interface StatusSignedUpProps {
    isPaidStatus: boolean;
    eventName: string;
    qrToken?: string;
    onRetry: () => void;
    serverError: string | null;
}

export default function StatusSignedUp({
    isPaidStatus,
    eventName,
    qrToken,
    onRetry,
    serverError
}: StatusSignedUpProps) {
    return (
        <div className={`flex h-full flex-col justify-center space-y-8 rounded-4xl border bg-(--bg-card) p-8 ${isPaidStatus ? 'border-success/30' : 'border-(--text-muted)/30'} shadow-2xl transition-all duration-500`}>
            <div className="space-y-4 text-center">
                <div className={`size-20 ${isPaidStatus ? 'bg-success/10' : 'bg-(--text-muted)/10'} mx-auto flex items-center justify-center rounded-full shadow-inner`}>
                    {isPaidStatus ? (
                        <CheckCircle2 className="text-success size-10" />
                    ) : (
                        <CreditCard className="size-10 text-(--text-muted)" />
                    )}
                </div>
                <h3 className="text-3xl leading-tight font-semibold text-(--text-main)">
                    {isPaidStatus ? 'Aanmelding Definitief!' : 'Betaling Gestart'}
                </h3>
                <p className="font-medium text-(--text-muted)">
                    {isPaidStatus
                        ? <>Je bent succesvol aangemeld voor <span className="font-semibold text-(--theme-purple)">{eventName}</span>.</>
                        : <>Je aanmelding voor <span className="font-semibold text-(--theme-purple)">{eventName}</span> is in afwachting van betaling.</>
                    }
                </p>
                {!isPaidStatus && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="inline-block  rounded-xl border border-(--border-color)/20 bg-(--bg-soft) px-4 py-2.5 text-[10px] font-semibold tracking-widest text-(--text-muted)">
                                Wachten op bevestiging van betaling...
                            </p>
                            <p className="mx-auto max-w-xs text-[11px] font-bold text-(--text-muted) opacity-70">
                                Zodra de betaling is afgerond verschijnt hier je digitale ticket. Dit kan enkele minuten duren.
                            </p>
                        </div>

                        <button
                            onClick={onRetry}
                            className="form-button flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-(--theme-purple) text-[10px] font-semibold tracking-widest text-white shadow-(--theme-purple)/20 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-(--theme-purple)/40  hover:shadow-xl active:scale-95"
                        >
                            <CreditCard className="size-4" />
                            <span>Betaal Nu</span>
                        </button>

                        {serverError && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                                <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                                <p className="text-xs font-bold text-red-700 italic">{serverError}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isPaidStatus ? (
                <div className="group animate-in fade-in zoom-in relative flex flex-col items-center rounded-[2.5rem] border border-(--border-color)/60 bg-(--bg-soft) p-8 transition-all duration-700 hover:bg-(--bg-card)">
                    <div className="rounded-3xl bg-white p-3 shadow-xl ring-1 ring-black/5">
                        <QRDisplay qrToken={qrToken || 'PENDING_VERIFICATION'} size={240} />
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px]  font-semibold tracking-[0.2em] text-(--text-muted) opacity-60">
                        <Ticket className="size-3" /> Toon bij de ingang
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-[2.5rem] border border-dashed border-(--border-color) bg-(--bg-soft)/50 p-8 opacity-60">
                    <div className="flex size-48 items-center justify-center rounded-3xl border border-(--border-color)/30 bg-white/5">
                        <Ticket className="size-16 text-(--text-muted) opacity-20" />
                    </div>
                    <p className="text-[10px] font-semibold  tracking-widest text-(--text-muted)">Ticket wordt gegenereerd na betaling</p>
                </div>
            )}
        </div>
    );
}
