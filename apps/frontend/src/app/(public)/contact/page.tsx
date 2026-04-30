export const revalidate = 3600;
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
            'Neem contact op met studievereniging Salve Mundi voor vragen, suggesties of informatie.',
    },
};

/**
 * Contactpagina — pure Server Component.
 * Islands (WhatsApp, Safe Havens) worden client-side gehydrateerd.
 * NUCLEAR SSR: Alle data (documenten) wordt op de server opgehaald voordat de pagina geflushd wordt.
 */
export default async function ContactPage() {
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
                            className="text-2xl font-bold text-[var(--text-main)] mb-6 text-center"
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
                                <span className="inline-block w-5 h-5" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                                    </svg>
                                </span>
                                Instagram
                            </a>

                            {/* Facebook */}
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-soft)] rounded-full hover:bg-[var(--bg-main)] transition-colors text-[var(--text-main)] font-semibold"
                            >
                                <span className="inline-block w-5 h-5" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.2v-2.9h2.2V9.3c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2v1.5h2.3l-.4 2.9h-1.9v7A10 10 0 0 0 22 12z" />
                                    </svg>
                                </span>
                                Facebook
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-soft)] rounded-full hover:bg-[var(--bg-main)] transition-colors text-[var(--text-main)] font-semibold"
                            >
                                <span className="inline-block w-5 h-5" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.4-2.6 5-2.6 5.3 0 6.3 3.5 6.3 8.1V24h-5V15.4c0-2.1 0-4.8-2.9-4.8-2.9 0-3.3 2.2-3.3 4.6V24h-5V8z" />
                                    </svg>
                                </span>
                                LinkedIn
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}


