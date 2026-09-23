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
        <div className="animate-in zoom-in-95 space-y-12 duration-500">
            <div className="space-y-4 text-center">
                <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                    <CheckCircle2 className="size-12 text-green-500" />
                </div>
                <h1 className="text-4xl leading-none font-semibold tracking-tighter text-(--text-main) italic md:text-6xl">
                    Aanmelding <span className="text-green-500">geslaagd!</span>
                </h1>
                <p className="mx-auto max-w-md text-lg font-medium text-(--text-muted)">
                    Bedankt! Je ticket{amount > 1 ? 's' : ''} {amount > 1 ? 'zijn' : 'is'} nu beschikbaar.
                </p>
                {redirectUrl && (
                    <p className="mt-2 text-base font-semibold text-(--theme-purple)">
                        Je wordt zo automatisch doorgestuurd...
                    </p>
                )}
            </div>

            <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
                {Array.from({ length: amount }).map((_, i) => (
                    <div
                        key={i}
                        id={`ticket-card-${i}`}
                        className="relative w-full max-w-95 min-w-75 space-y-6 overflow-hidden rounded-[3rem] border border-(--border-color) bg-(--bg-card) p-8 shadow-xl sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-base font-semibold text-(--theme-purple)">Ticket {i + 1} / {amount}</p>
                            <div className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-black/5">
                                <QRDisplay qrToken={
                                    (() => {
                                        const tickets = signupData?.tickets || [];
                                        const ticket = tickets.find((_, idx) => idx === i);
                                        return ticket?.qr_token || `${signupData?.qr_token || ''}${amount > 1 ? `#${i}` : ''}`;
                                    })()
                                } size={180} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-semibold tracking-tight text-(--text-main)">{eventName}</h3>
                                <p className="text-sm font-bold text-(--text-muted) opacity-60">
                                    #{signupData?.id}{amount > 1 ? `-${i + 1}` : ''}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => downloadTicket(`ticket-card-${i}`, eventName)}
                            className="absolute top-4 right-4 icon-button rounded-full border border-(--border-color) bg-(--bg-soft) p-3 text-(--text-muted) shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-(--theme-purple) hover:text-white"
                            title="Download Ticket"
                        >
                            <Save className="size-5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <BackButton
                    href="/activiteiten"
                    text="Terug naar overzicht"
                    className="h-14 rounded-2xl bg-(--theme-purple) px-10 text-white shadow-(--theme-purple)/20 shadow-xl"
                />
                {isLoggedIn && (
                    <BackButton
                        href="/profiel/tickets"
                        text="Alle tickets"
                        icon={QrCode}
                        className="h-14 rounded-2xl border border-(--border-color) bg-(--bg-card) px-10 text-(--text-main)"
                    />
                )}
            </div>
        </div>
    );
}
