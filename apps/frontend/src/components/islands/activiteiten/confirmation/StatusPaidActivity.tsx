'use client';

import { CheckCircle2, Save, QrCode } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';
import QRDisplay from '@/shared/ui/QRDisplay';
import { type SignupData } from '../ConfirmationIsland';

interface StatusPaidActivityProps {
    signupData: SignupData | null;
    isLoggedIn: boolean;
    downloadTicket: (elementId: string, ticketName: string) => void;
}

export default function StatusPaidActivity({
    signupData,
    isLoggedIn,
    downloadTicket
}: StatusPaidActivityProps) {
    const amount = signupData?.amount_tickets || (signupData?.tickets?.length) || 1;
    const eventName = signupData?.event_id?.name || 'Activiteit';
    const redirectUrl = signupData?.event_id?.custom_url || signupData?.custom_url;

    return (
        <div className="space-y-12 duration-500">
            <div className="space-y-4 text-center">
                <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-theme-success/10 ring-1 ring-theme-success/20">
                    <CheckCircle2 className="size-12 text-theme-success" />
                </div>
                <h1 className="text-4xl font-semibold tracking-tighter text-text-main italic md:text-6xl leading-none">
                    Aanmelding <span className="text-theme-success">geslaagd!</span>
                </h1>
                <p className="mx-auto max-w-md text-lg font-medium text-text-muted">
                    Bedankt! Je ticket{amount > 1 ? 's' : ''} {amount > 1 ? 'zijn' : 'is'} nu beschikbaar.
                </p>
                {redirectUrl && (
                    <p className="mt-2 text-base font-semibold text-theme-purple">
                        Je wordt zo automatisch doorgestuurd...
                    </p>
                )}
            </div>

            <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
                {Array.from({ length: amount }).map((_, i) => (
                    <div
                        key={i}
                        id={`ticket-card-${i}`}
                        className="card-ticket-item"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-base font-semibold text-theme-purple">Ticket {i + 1} / {amount}</p>
                            <div className="rounded-3xl bg-wit-paars p-4 shadow-lg ring-1 ring-black/5">
                                <QRDisplay qrToken={
                                    (() => {
                                        const tickets = signupData?.tickets || [];
                                        const ticket = tickets.find((_, idx) => idx === i);
                                        return ticket?.qr_token || `${signupData?.qr_token || ''}${amount > 1 ? `#${i}` : ''}`;
                                    })()
                                } size={180} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-semibold tracking-tight text-text-main">{eventName}</h3>
                                <p className="text-sm font-bold text-text-muted opacity-60">
                                    #{signupData?.id}{amount > 1 ? `-${i + 1}` : ''}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => downloadTicket(`ticket-card-${i}`, eventName)}
                            className="icon-button absolute top-4 right-4 rounded-full border border-border-color bg-bg-soft p-3 text-text-muted backdrop-blur-md hover:scale-110 hover:bg-theme-purple hover:text-wit-paars"
                            title="Download Ticket"
                            type="button">
                            <Save className="size-5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <BackButton
                    href="/activiteiten"
                    text="Terug naar overzicht"
                    className="form-button h-14 rounded-2xl bg-theme-purple px-10 text-wit-paars shadow-xl shadow-theme-purple/20"
                />
                {isLoggedIn && (
                    <BackButton
                        href="/profiel/tickets"
                        text="Alle tickets"
                        icon={QrCode}
                        className="form-button h-14 rounded-2xl border border-border-color bg-bg-card px-10 text-text-main"
                    />
                )}
            </div>
        </div>
    );
}
