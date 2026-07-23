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
        <div className="space-y-12 animate-in zoom-in-95 duration-500">
            <div className="space-y-4 text-center">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold text-(--text-main) tracking-tighter italic leading-none">
                    Aanmelding <span className="text-green-500">geslaagd!</span>
                </h1>
                <p className="text-(--text-muted) text-lg font-medium max-w-md mx-auto">
                    Bedankt! Je ticket{amount > 1 ? 's' : ''} {amount > 1 ? 'zijn' : 'is'} nu beschikbaar.
                </p>
                {redirectUrl && (
                    <p className="text-base font-semibold text-(--theme-purple) mt-2">
                        Je wordt zo automatisch doorgestuurd...
                    </p>
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
                {Array.from({ length: amount }).map((_, i) => (
                    <div
                        key={i}
                        id={`ticket-card-${i}`}
                        className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-75 max-w-95 p-8 rounded-[3rem] bg-(--bg-card) border border-(--border-color) shadow-xl space-y-6 relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-base font-semibold text-(--theme-purple)">Ticket {i + 1} / {amount}</p>
                            <div className="p-4 bg-white rounded-3xl shadow-lg ring-1 ring-black/5">
                                <QRDisplay qrToken={
                                    (() => {
                                        const tickets = signupData?.tickets || [];
                                        const ticket = tickets.find((_, idx) => idx === i);
                                        return ticket?.qr_token || `${signupData?.qr_token || ''}${amount > 1 ? `#${i}` : ''}`;
                                    })()
                                } size={180} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-semibold text-(--text-main) tracking-tight">{eventName}</h3>
                                <p className="text-sm font-bold text-(--text-muted) opacity-60">
                                    #{signupData?.id}{amount > 1 ? `-${i + 1}` : ''}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => downloadTicket(`ticket-card-${i}`, eventName)}
                            className="icon-button absolute top-4 right-4 p-3 rounded-full bg-(--bg-soft) border border-(--border-color) text-(--text-muted) hover:bg-(--theme-purple) hover:text-white hover:scale-110 transition-all shadow-lg backdrop-blur-md"
                            title="Download Ticket"
                        >
                            <Save className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <BackButton
                    href="/activiteiten"
                    text="Terug naar overzicht"
                    className="h-14 px-10 rounded-2xl bg-(--theme-purple) text-white shadow-xl shadow-(--theme-purple)/20"
                />
                {isLoggedIn && (
                    <BackButton
                        href="/profiel/tickets"
                        text="Alle tickets"
                        icon={QrCode}
                        className="h-14 px-10 rounded-2xl bg-(--bg-card) border border-(--border-color) text-(--text-main)"
                    />
                )}
            </div>
        </div>
    );
}
