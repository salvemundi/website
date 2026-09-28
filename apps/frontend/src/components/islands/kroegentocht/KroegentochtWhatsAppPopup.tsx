"use client";

import React, { useEffect, useState } from "react";
import { getKroegentochtWhatsAppLink } from "@/server/actions/events/kroegentocht/kroegentocht-public.actions";
import { MessageCircle, ArrowRight, X } from "lucide-react";

interface KroegentochtWhatsAppPopupProps {
    signupId?: number;
    token?: string;
}

export function KroegentochtWhatsAppPopup({ signupId, token }: KroegentochtWhatsAppPopupProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [communityUrl, setCommunityUrl] = useState<string | null>(null);

    useEffect(() => {
        async function checkEligibility() {
            const response = await getKroegentochtWhatsAppLink(signupId, token);
            if (response.success && response.url) {
                setCommunityUrl(response.url);
                setIsOpen(true);
            }
        }
        void checkEligibility();
    }, [signupId, token]);

    if (!isOpen || !communityUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="relative mx-4 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-2xl">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 icon-button text-white/60 transition-colors hover:text-white"
                    aria-label="Sluiten"
                >
                    <X className="size-5" />
                </button>

                <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                    <MessageCircle className="size-6" />
                </div>

                <h3 className="mb-2 text-xl font-semibold">Join de WhatsApp Community!</h3>
                <p className="mb-6 text-sm leading-relaxed text-white/70">
                    Je betaling is succesvol ontvangen! Voeg jezelf direct toe aan de officiële Salve Mundi Kroegentocht community om op de hoogte te blijven van routes, tijden en groepsindelingen.
                </p>

                <a
                    href={communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30"
                >
                    Deelnemen aan community
                    <ArrowRight className="size-4" />
                </a>
            </div>
        </div>
    );
}
