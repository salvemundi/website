import React from 'react';
import Link from 'next/link';
import ActiveLink from '@/components/ui/ActiveLink';
import { InstagramIcon as SiInstagram, FacebookIcon as SiFacebook, TiktokIcon as SiTiktok, LinkedinIcon as FaLinkedin } from '@/shared/icons/social';
import { ROUTES } from '@/lib/config/routes';
import type { Committee } from '@salvemundi/validations/schema/committees.zod';
import type { Document } from '@salvemundi/validations/schema/website.zod';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { type ExtendedSession } from '@/types/auth';

interface FooterIslandProps {
    documents: Document[];
    disabledRoutes?: string[];
    committees: Committee[];
    initialSession?: ExtendedSession | null;
}

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

const HEADING_CLS =
    'text-sm font-bold uppercase tracking-[0.3em] mb-4 text-center md:text-left ' +
    'text-purple-700 dark:text-white';

const LINK_CLS =
    'inline-flex items-center gap-1 rounded-full px-2 py-1 transition ' +
    'text-purple-800 dark:text-(--text-light) ' +
    'hover:bg-purple-500/10 dark:hover:bg-white/10 ' +
    'hover:text-purple-700 dark:hover:text-white';

const MUTED_CLS = 'text-purple-800 dark:text-(--text-light)';

const FooterIsland: React.FC<FooterIslandProps> = async ({ documents, disabledRoutes = [], committees, initialSession }) => {
    const isAuthenticated = !!initialSession?.user;

    const assetUrl = '/api/assets';

    const allPageLinks = [
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Intro', href: ROUTES.INTRO },
        { label: 'Activiteiten', href: ROUTES.ACTIVITIES },
        { label: 'Commissies', href: ROUTES.COMMITTEES },
        { label: 'Contact', href: ROUTES.CONTACT },
        { label: 'Sticker Kaart', href: ROUTES.STICKERS },
        { label: 'Safe Havens', href: ROUTES.SAFE_HAVENS },
        { label: 'Lidmaatschap', href: ROUTES.MEMBERSHIP },
        { label: 'Kroegentocht', href: ROUTES.PUB_CRAWL },
        { label: 'Reis', href: ROUTES.TRIP },
    ];

    const pageLinks = allPageLinks.filter(link => !disabledRoutes.includes(link.href));

    const sortedCommittees = [...committees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    return (
        <footer className="relative overflow-hidden bg-bg-card dark:bg-gradient-theme border-t border-border-color/20">
            <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-purple-200/10 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-purple-100/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8 pb-safe-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">

                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className={HEADING_CLS}>Informatie</h3>
                        <ul className={`space-y-2 text-sm ${MUTED_CLS}`}>
                            <li>Rachelsmolen 1</li>
                            <li>5612 MA Eindhoven</li>
                            <li>KvK nr. 70280606</li>
                            {documents.map((doc) => (
                                <li key={doc.id}>
                                    <a
                                        href={`${assetUrl}/${doc.file}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${LINK_CLS} bg-white/10`}
                                        title={doc.description !== null ? doc.description : undefined}
                                    >
                                        {doc.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className={HEADING_CLS}>Pagina&apos;s</h3>
                        <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-2 text-sm w-full max-w-fit mx-auto md:mx-0 md:max-w-none">
                            {pageLinks.map((link) => (
                                <li key={link.href}>
                                    <ActiveLink href={link.href} className={LINK_CLS} activeClassName="bg-purple-500/10 text-purple-700">
                                        {link.label}
                                    </ActiveLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 flex flex-col items-center md:items-start">
                        <h3 className={`${HEADING_CLS} text-center w-full`}>Commissies</h3>

                        <div className="flex gap-x-12 gap-y-2 text-sm  ">
                            <div className="flex flex-col gap-y-2 text-left">
                                {sortedCommittees.slice(0, 6).map((committee) => {
                                    const cleaned = cleanCommitteeName(committee.name);
                                    const slug = slugify(cleaned);
                                    return (
                                        <div key={committee.id}>
                                            <ActiveLink href={`${ROUTES.COMMITTEES}/${slug}`} className={LINK_CLS} activeClassName="bg-purple-500/10 text-purple-700">
                                                {cleaned}
                                            </ActiveLink>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-y-2 text-left">
                                {sortedCommittees.slice(6, 12).map((committee) => {
                                    const cleaned = cleanCommitteeName(committee.name);
                                    const slug = slugify(cleaned);
                                    return (
                                        <div key={committee.id}>
                                            <ActiveLink href={`${ROUTES.COMMITTEES}/${slug}`} className={LINK_CLS} activeClassName="bg-purple-500/10 text-purple-700">
                                                {cleaned}
                                            </ActiveLink>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 text-center lg:text-center">
                            <ActiveLink href={ROUTES.COMMITTEES} className={`${LINK_CLS} font-bold text-purple-500`} activeClassName="bg-purple-500/10 text-purple-700">
                                Alle commissies bekijken
                            </ActiveLink>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className={HEADING_CLS}>Contact</h3>
                        <ul className="space-y-2 text-sm mb-6">
                            <li>
                                <ObfuscatedEmail
                                    email="info@salvemundi.nl"
                                    className={LINK_CLS}
                                    showIcon={false}
                                />
                            </li>
                            <li>
                                <a href="tel:+31624827777" className={LINK_CLS}>
                                    +31 6 24827777
                                </a>
                            </li>

                            {isAuthenticated && (
                                <li>
                                    <a
                                        href="https://wa.me/31624827777"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={LINK_CLS}
                                    >
                                        WhatsApp
                                    </a>
                                </li>
                            )}

                            <li>
                                <Link
                                    href={ROUTES.SAFE_HAVENS}
                                    className={
                                        'inline-flex items-center gap-1 squircle px-2 py-1 font-semibold transition ' +
                                        'bg-purple-500/20 text-purple-700 ' +
                                        'dark:bg-white/15 dark:text-white ' +
                                        'hover:bg-purple-500/30 dark:hover:bg-white/25'
                                    }
                                >
                                    Safe Havens
                                </Link>
                            </li>
                        </ul>

                        <h3 className={HEADING_CLS}>Social Media</h3>
                        <div className="flex justify-center md:justify-start gap-3">
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-purple-500/15 dark:bg-white/10 ' +
                                    'text-purple-700 dark:text-white ' +
                                    'hover:bg-purple-500/25 dark:hover:bg-white/20'
                                }
                                aria-label="Instagram"
                            >
                                <SiInstagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-purple-500/15 dark:bg-white/10 ' +
                                    'text-purple-700 dark:text-white ' +
                                    'hover:bg-purple-500/25 dark:hover:bg-white/20'
                                }
                                aria-label="Facebook"
                            >
                                <SiFacebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-purple-500/15 dark:bg-white/10 ' +
                                    'text-purple-700 dark:text-white ' +
                                    'hover:bg-purple-500/25 dark:hover:bg-white/20'
                                }
                                aria-label="LinkedIn"
                            >
                                <FaLinkedin className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.tiktok.com/@salve.mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-purple-500/15 dark:bg-white/10 ' +
                                    'text-purple-700 dark:text-white ' +
                                    'hover:bg-purple-500/25 dark:hover:bg-white/20'
                                }
                                aria-label="TikTok"
                            >
                                <SiTiktok className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className={`text-sm ${MUTED_CLS}`}>
                        Copyright © 2026 Salve Mundi — alle rechten voorbehouden.{' '}
                        <a
                            href="https://github.com/salvemundi/website"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={LINK_CLS}
                        >
                            Source code
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default FooterIsland;
