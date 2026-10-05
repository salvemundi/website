import type { Metadata } from 'next';
import { connection } from 'next/server';
import ContactInfoCard from '@/components/ui/social/ContactInfoCard';
import { getDocumenten } from '@/server/actions/public/website.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { InstagramIcon as SiInstagram, FacebookIcon as SiFacebook, TiktokIcon as SiTiktok, LinkedinIcon as FaLinkedin } from '@/shared/icons/social';

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

export default async function ContactPage() {
    return (
        <ContactContent />
    );
}

async function ContactContent() {
    await connection();
    const [documenten, session] = await Promise.all([
        getDocumenten(),
        getEnrichedSession()
    ]);

    return (
        <div>
            <h1 className="sr-only">Contact</h1>

            <div className="mx-auto max-w-7xl px-fluid-md py-fluid-lg">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">

                    <ContactInfoCard 
                        documenten={documenten} 
                        isLoggedIn={!!session?.user}
                    />

                    <section
                        aria-labelledby="social-media-header"
                        className="pt-4"
                    >
                        <h2
                            id="social-media-header"
                            className="mb-6 text-center text-2xl font-black text-theme-purple"
                        >
                            Volg Ons Op Social Media
                        </h2>

                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 squircle border border-border-color/40 bg-bg-card px-6 py-3 font-semibold text-text-main transition-all hover:border-theme-purple hover:text-theme-purple"
                            >
                                <SiInstagram className="size-5 text-theme-purple" aria-hidden="true" />
                                Instagram
                            </a>
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 squircle border border-border-color/40 bg-bg-card px-6 py-3 font-semibold text-text-main transition-all hover:border-theme-purple hover:text-theme-purple"
                            >
                                <SiFacebook className="size-5 text-theme-purple" aria-hidden="true" />
                                Facebook
                            </a>
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 squircle border border-border-color/40 bg-bg-card px-6 py-3 font-semibold text-text-main transition-all hover:border-theme-purple hover:text-theme-purple"
                            >
                                <FaLinkedin className="size-5 text-theme-purple" aria-hidden="true" />
                                LinkedIn
                            </a>
                            <a
                                href="https://www.tiktok.com/@salve.mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 squircle border border-border-color/40 bg-bg-card px-6 py-3 font-semibold text-text-main transition-all hover:border-theme-purple hover:text-theme-purple"
                            >
                                <SiTiktok className="size-5 text-theme-purple" aria-hidden="true" />
                                TikTok
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}


