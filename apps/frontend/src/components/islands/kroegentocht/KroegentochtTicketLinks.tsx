'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileDown, MessageCircle, Ticket, X } from 'lucide-react';
import {
    claimKroegentochtTickets,
    type MyKroegTickets
} from '@/server/actions/events/kroegentocht/kroegentocht-tickets.actions';

/** Knoppen voor WhatsApp-community en PDF-download van één inschrijving. */
export function KroegentochtTicketButtons({ tickets, dark = false }: { tickets: MyKroegTickets; dark?: boolean }) {
    return (
        <div className="flex flex-col gap-3">
            {tickets.whatsappUrl && (
                <a
                    href={tickets.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
                >
                    <MessageCircle className="size-4" />
                    Join de WhatsApp community
                    <ArrowRight className="size-4" />
                </a>
            )}
            <a
                href={tickets.pdfUrl}
                download
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold transition-all ${
                    dark
                        ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                        : 'bg-theme-purple text-white shadow-lg hover:opacity-90'
                }`}
            >
                <FileDown className="size-4" />
                Download tickets (PDF met QR-code{tickets.names.length === 1 ? '' : 's'})
            </a>
        </div>
    );
}

/** Blok op de kroegentocht-pagina: tickets van deze browser (cookie, 14 dagen). */
export function KroegentochtMyTicketsCard({ items }: { items: MyKroegTickets[] }) {
    if (items.length === 0) return null;
    return (
        <section className="squircle-lg mb-8 bg-bg-card p-6 shadow-xl sm:p-8 dark:border dark:border-white/10">
            <h2 className="mb-1 flex items-center gap-2 text-2xl font-black text-theme-purple">
                <Ticket className="size-6" />
                Jouw kroegentocht-tickets
            </h2>
            <p className="mb-6 text-sm text-text-muted">
                Je bent ingeschreven! Hier vind je de WhatsApp-community en je tickets terug.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
                {items.map((item) => (
                    <div key={item.signupId} className="rounded-2xl border border-border-color/40 p-5">
                        <p className="text-xs font-bold tracking-wider text-text-muted uppercase">{item.eventName}</p>
                        <p className="mt-1 mb-4 text-sm font-semibold text-text-main">{item.names.join(', ')}</p>
                        <KroegentochtTicketButtons tickets={item} />
                    </div>
                ))}
            </div>
        </section>
    );
}

/**
 * Popup op de bevestigingspagina. Probeert de tickets te claimen tot de betaling binnen is
 * (de webhook van Mollie kan een paar seconden achterlopen), en zet daarbij de cookie.
 */
export function KroegentochtClaimTicketsPopup({ signupId, token }: { signupId?: number; token?: string }) {
    const [tickets, setTickets] = useState<MyKroegTickets | null>(null);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (!signupId || !token) return;
        let cancelled = false;
        let attempts = 0;
        const tryClaim = async () => {
            attempts += 1;
            const res = await claimKroegentochtTickets(signupId, token);
            if (cancelled) return;
            if (res.status === 'ok') {
                setTickets(res.tickets);
            } else if (res.status === 'pending' && attempts < 40) {
                setTimeout(() => { void tryClaim(); }, 3000);
            }
        };
        void tryClaim();
        return () => { cancelled = true; };
    }, [signupId, token]);

    if (!tickets || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="relative mx-4 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-2xl">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 icon-button text-white/60 transition-colors hover:text-white"
                    aria-label="Sluiten"
                    type="button">
                    <X className="size-5" />
                </button>

                <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                    <Ticket className="size-6" />
                </div>

                <h3 className="mb-2 text-xl font-semibold">Je bent ingeschreven!</h3>
                <p className="mb-6 text-sm leading-relaxed text-white/70">
                    Join de WhatsApp-community voor routes, tijden en groepsindelingen, en download je tickets.
                    Je kunt deze links de komende 14 dagen ook terugvinden op de kroegentocht-pagina.
                </p>

                <KroegentochtTicketButtons tickets={tickets} dark />
            </div>
        </div>
    );
}
