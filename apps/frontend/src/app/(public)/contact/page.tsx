
import type { Metadata } from 'next';
import ContactInfoCard from '@/components/ui/social/ContactInfoCard';
import { getDocumenten } from '@/server/actions/website.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

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
        auth.api.getSession({ headers: await headers() })
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
                        className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-8"
                    >
                        <h2
                            id="social-media-header"
                            className="text-2xl font-semibold text-[var(--text-main)] mb-6 text-center"
                        >
                            Volg Ons Op Social Media
                        </h2>

                        <div className="flex flex-wrap justify-center gap-4">
                            {/* Instagram */}
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-soft)] rounded-full hover:bg-[var(--bg-main)] transition-colors text-[var(--text-main)] font-semibold"
                            >
                                <Instagram className="w-5 h-5" aria-hidden="true" />
                                Instagram
                            </a>

                            {/* Facebook */}
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-soft)] rounded-full hover:bg-[var(--bg-main)] transition-colors text-[var(--text-main)] font-semibold"
                            >
                                <Facebook className="w-5 h-5" aria-hidden="true" />
                                Facebook
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-soft)] rounded-full hover:bg-[var(--bg-main)] transition-colors text-[var(--text-main)] font-semibold"
                            >
                                <Linkedin className="w-5 h-5" aria-hidden="true" />
                                LinkedIn
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}


