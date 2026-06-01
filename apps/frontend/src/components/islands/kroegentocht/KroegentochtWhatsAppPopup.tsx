"use client";

import React, { useEffect, useState } from "react";
import { getKroegentochtWhatsAppLink } from "@/server/actions/events/kroegentocht.actions";
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
            <div className="relative w-full max-w-md p-8 bg-white/10 border border-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl text-white mx-4">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    aria-label="Sluiten"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6 border border-emerald-500/30">
                    <MessageCircle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Join de WhatsApp Community!</h3>
                <p className="text-sm text-white/70 mb-6 leading-relaxed">
                    Je betaling is succesvol ontvangen! Voeg jezelf direct toe aan de officiële Salve Mundi Kroegentocht community om op de hoogte te blijven van routes, tijden en groepsindelingen.
                </p>

                <a
                    href={communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 font-medium rounded-xl text-white transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                    Deelnemen aan community
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
