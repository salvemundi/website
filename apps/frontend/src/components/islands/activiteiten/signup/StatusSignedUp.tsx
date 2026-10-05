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
        <div className={`status-signup-container ${isPaidStatus ? 'border-theme-success/30' : 'border-border-color/60'}`}>
            <div className="space-y-4 text-center">
                <div className={`status-signup-icon-wrapper ${isPaidStatus ? 'bg-theme-success/10' : 'bg-bg-soft'}`}>
                    {isPaidStatus ? (
                        <CheckCircle2 className="size-10 text-theme-success" />
                    ) : (
                        <CreditCard className="size-10 text-text-muted" />
                    )}
                </div>
                <h3 className="text-3xl font-semibold text-text-main">
                    {isPaidStatus ? 'Aanmelding Definitief!' : 'Betaling Gestart'}
                </h3>
                <p className="font-medium text-text-muted">
                    {isPaidStatus
                        ? <>Je bent succesvol aangemeld voor <span className="font-semibold text-theme-purple">{eventName}</span>.</>
                        : <>Je aanmelding voor <span className="font-semibold text-theme-purple">{eventName}</span> is in afwachting van betaling.</>
                    }
                </p>
                {!isPaidStatus && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="status-signup-pill">
                                Wachten op bevestiging van betaling...
                            </p>
                            <p className="status-signup-hint">
                                Zodra de betaling is afgerond verschijnt hier je digitale ticket. Dit kan enkele minuten duren.
                            </p>
                        </div>

                        <button
                            onClick={onRetry}
                            className="form-button h-14 w-full"
                            type="button">
                            <CreditCard className="size-4" />
                            <span>Betaal Nu</span>
                        </button>

                        {serverError && (
                            <div className="mt-4 alert-error-box">
                                <AlertCircle className="alert-error-icon" />
                                <p className="alert-error-text">{serverError}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isPaidStatus ? (
                <div className="status-signup-qr-card">
                    <div className="status-signup-qr-box">
                        <QRDisplay qrToken={qrToken || 'PENDING_VERIFICATION'} size={240} />
                    </div>
                    <div className="status-signup-qr-caption">
                        <Ticket className="size-3" /> Toon bij de ingang
                    </div>
                </div>
            ) : (
                <div className="status-signup-pending-card">
                    <div className="status-signup-pending-box">
                        <Ticket className="size-16 text-text-muted opacity-20" />
                    </div>
                    <p className="text-2xs font-semibold tracking-widest text-text-muted">Ticket wordt gegenereerd na betaling</p>
                </div>
            )}
        </div>
    );
}
