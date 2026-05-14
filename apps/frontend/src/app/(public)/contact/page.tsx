
import type { Metadata } from 'next';
import ContactInfoCard from '@/components/ui/social/ContactInfoCard';
import { getDocumenten } from '@/server/actions/public/website.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';

// SEO metadata conform de V7 standaard
export const metadata: Metadata = {
    title: 'Contact | Salve Mundi',
    description:
        'Neem contact op met studievereniging Salve Mundi voor vragen, suggesties of informatie.',
    openGraph: {
        title: 'Contact | Salve Mundi',
        description:
            'Neem contact op met studievereniging Salve Mundi voor vragen, suggesties of informatie.' } };

/**
 * Contactpagina — pure Server Component.
 * Islands (WhatsApp, Safe Havens) worden client-side gehydrateerd.
 * NUCLEAR SSR: Alle data (documenten) wordt op de server opgehaald voordat de pagina geflushd wordt.
 */
import { connection } from 'next/server';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

export default async function ContactPage() {
    return (
        <ContactContent />
    );
}

async function ContactContent() {
    await connection();
    // Haal alle benodigde data op voor de hele pagina (Nuclear SSR)
    const [documenten, session] = await Promise.all([
        getDocumenten(),
        getEnrichedSession()
    ]);

    return (
        <div>
            <h1 className="sr-only">Contact</h1>

            <div className="mx-auto max-w-7xl px-4 pt-8 pb-8 sm:py-10 md:py-12">
                <div className="max-w-6xl mx-auto flex w-full flex-col gap-8">

                    {/* 2-koloms grid — Informatie | Contact */}
                    <ContactInfoCard 
                        documenten={documenten} 
                        isLoggedIn={!!session?.user}
                    />

                    {/* Social Media sectie - Wordt direct statisch geserveerd */}
                    <section
                        aria-labelledby="social-media-header"
                        className="bg-(--bg-card) dark:border dark:border-white/10 rounded-3xl shadow-lg p-8"
                    >
                        <h2
                            id="social-media-header"
                            className="text-2xl font-semibold text-(--text-main) mb-6 text-center"
                        >
                            Volg Ons Op Social Media
                        </h2>

                        <div className="flex flex-wrap justify-center gap-4">
                            {/* Instagram */}
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-(--bg-soft) rounded-full hover:bg-(--bg-main) transition-colors text-(--text-main) font-semibold"
                            >
                                <Instagram className="w-5 h-5" aria-hidden="true" />
                                Instagram
                            </a>

                            {/* Facebook */}
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-(--bg-soft) rounded-full hover:bg-(--bg-main) transition-colors text-(--text-main) font-semibold"
                            >
                                <Facebook className="w-5 h-5" aria-hidden="true" />
                                Facebook
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-(--bg-soft) rounded-full hover:bg-(--bg-main) transition-colors text-(--text-main) font-semibold"
                            >
                                <Linkedin className="w-5 h-5" aria-hidden="true" />
                                LinkedIn
                            </a>

                            {/* TikTok */}
                            <a
                                href="https://www.tiktok.com/@salve.mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-(--bg-soft) rounded-full hover:bg-(--bg-main) transition-colors text-(--text-main) font-semibold"
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M19.52 6.2c-1.2-.88-2.03-2.2-2.27-3.72h-3.1v14.62c0 1.46-1.18 2.64-2.64 2.64a2.64 2.64 0 0 1 0-5.28c.17 0 .34.02.5.05V11.3a6 6 0 1 0 0 11.95 5.97 5.97 0 0 0 5.98-5.98V9.13a8.93 8.93 0 0 0 4.12 1.03V7.02a5.93 5.93 0 0 1-2.59-.83Z" />
                                </svg>
                                TikTok
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}


