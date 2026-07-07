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
        <div className={`h-full flex flex-col justify-center space-y-8 p-8 rounded-4xl bg-(--bg-card) border ${isPaidStatus ? 'border-success/30' : 'border-(--text-muted)/30'} shadow-2xl transition-all duration-500`}>
            <div className="text-center space-y-4">
                <div className={`w-20 h-20 ${isPaidStatus ? 'bg-success/10' : 'bg-(--text-muted)/10'} rounded-full flex items-center justify-center mx-auto shadow-inner`}>
                    {isPaidStatus ? (
                        <CheckCircle2 className="h-10 w-10 text-success" />
                    ) : (
                        <CreditCard className="h-10 w-10 text-(--text-muted)" />
                    )}
                </div>
                <h3 className="text-3xl font-semibold text-(--text-main) leading-tight">
                    {isPaidStatus ? 'Aanmelding Definitief!' : 'Betaling Gestart'}
                </h3>
                <p className="text-(--text-muted) font-medium">
                    {isPaidStatus
                        ? <>Je bent succesvol aangemeld voor <span className="text-(--theme-purple) font-semibold">{eventName}</span>.</>
                        : <>Je aanmelding voor <span className="text-(--theme-purple) font-semibold">{eventName}</span> is in afwachting van betaling.</>
                    }
                </p>
                {!isPaidStatus && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px]  font-semibold text-(--text-muted) tracking-widest bg-(--bg-soft) px-4 py-2.5 rounded-xl border border-(--border-color)/20 inline-block">
                                Wachten op bevestiging van betaling...
                            </p>
                            <p className="text-[11px] font-bold text-(--text-muted) opacity-70 max-w-xs mx-auto">
                                Zodra de betaling is afgerond verschijnt hier je digitale ticket. Dit kan enkele minuten duren.
                            </p>
                        </div>

                        <button
                            onClick={onRetry}
                            className="w-full h-14 bg-(--theme-purple) text-white font-semibold rounded-2xl shadow-lg shadow-(--theme-purple)/20 hover:shadow-xl hover:shadow-(--theme-purple)/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3  text-[10px] tracking-widest"
                        >
                            <CreditCard className="h-4 w-4" />
                            <span>Betaal Nu</span>
                        </button>

                        {serverError && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 mt-4">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-bold italic">{serverError}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isPaidStatus ? (
                <div className="relative group p-8 bg-(--bg-soft) rounded-[2.5rem] border border-(--border-color)/60 flex flex-col items-center transition-all hover:bg-(--bg-card) animate-in fade-in zoom-in duration-700">
                    <div className="p-3 bg-white rounded-3xl shadow-xl ring-1 ring-black/5">
                        <QRDisplay qrToken={qrToken || 'PENDING_VERIFICATION'} size={240} />
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px]  font-semibold text-(--text-muted) opacity-60 tracking-[0.2em]">
                        <Ticket className="h-3 w-3" /> Toon bij de ingang
                    </div>
                </div>
            ) : (
                <div className="p-8 bg-(--bg-soft)/50 rounded-[2.5rem] border border-dashed border-(--border-color) flex flex-col items-center justify-center space-y-4 opacity-60">
                    <div className="w-48 h-48 bg-white/5 rounded-3xl flex items-center justify-center border border-(--border-color)/30">
                        <Ticket className="h-16 w-16 text-(--text-muted) opacity-20" />
                    </div>
                    <p className="text-[10px] font-semibold  tracking-widest text-(--text-muted)">Ticket wordt gegenereerd na betaling</p>
                </div>
            )}
        </div>
    );
}
