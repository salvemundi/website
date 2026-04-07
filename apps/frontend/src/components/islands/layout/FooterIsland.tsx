'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { ROUTES } from '@/lib/routes';
import type { Committee, Document } from '@salvemundi/validations';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

// ─── Props ────────────────────────────────────────────────────────────────────
// Alle data wordt server-side opgehaald en als props doorgegeven.
// Dit island is 'use client' uitsluitend vanwege de auth-gated WhatsApp-link.
interface FooterIslandProps {
    documents: Document[];
    disabledRoutes?: string[];
    committees: Committee[];
}

// Zorgt voor een eenduidige presentatie van commissienamen door redundante achtervoegsels te verwijderen.
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

// ─── CSS Token Strategie ──────────────────────────────────────────────────────
// De footer heeft altijd bg-gradient-theme als achtergrond.
//   Light mode: gradient-start=#fdfbff (bijna wit) → tekst moet donker zijn
//   Dark mode:  gradient-start=#805480 (donker paars) → tekst moet licht zijn
//
// Kleurkeuzes:
//   Koppen:      light → var(--color-purple-700) | dark → var(--color-white)
//   Body-tekst:  light → var(--color-purple-800) | dark → rgba(255,255,255,0.80)  [= var(--text-light)]
//   Link-tekst:  erft body-tekst
//   Link-hover (achtergrond): light → var(--color-purple-500)/10 | dark → white/10
//   Link-hover (tekst):       light → var(--color-purple-700)  | dark → var(--color-white)
//   Social-icons bg:          altijd white/10 → white/20 (zichtbaar op beide)

const HEADING_CLS =
    'text-sm font-bold uppercase tracking-[0.3em] mb-4 ' +
    'text-[var(--color-purple-700)] dark:text-[var(--color-white)]';

const LINK_CLS =
    'inline-flex items-center gap-1 rounded-full px-2 py-1 transition ' +
    'text-[var(--color-purple-800)] dark:text-[var(--text-light)] ' +
    'hover:bg-[var(--color-purple-500)]/10 dark:hover:bg-[var(--color-white)]/10 ' +
    'hover:text-[var(--color-purple-700)] dark:hover:text-[var(--color-white)]';

const MUTED_CLS = 'text-[var(--color-purple-800)] dark:text-[var(--text-light)]';

// ─── Component ────────────────────────────────────────────────────────────────
const FooterIsland: React.FC<FooterIslandProps> = ({ documents, disabledRoutes = [], committees }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Better Auth sessie — uitsluitend via authClient.useSession() conform V7-advies
    const { data: session } = authClient.useSession();
    const isAuthenticated = !!session?.user;

    // Asset-links conform V7 (server-side proxy)
    const assetUrl = '/api/assets';

    // Navigatielinks conform de V7 Frontend Routes & Server Actions documentatie
    const allPageLinks = [
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Intro', href: ROUTES.INTRO },
        { label: 'Activiteiten', href: ROUTES.ACTIVITIES },
        { label: 'Commissies', href: ROUTES.COMMITTEES },
        { label: 'Contact', href: ROUTES.CONTACT },
        { label: 'Safe Havens', href: ROUTES.STICKERS },
        { label: 'Lidmaatschap', href: ROUTES.MEMBERSHIP },
        { label: 'Kroegentocht', href: ROUTES.PUB_CRAWL },
        { label: 'Reis', href: ROUTES.TRIP },
    ];

    // Filter links die op een Feature Flag staan
    const pageLinks = allPageLinks.filter(link => !disabledRoutes.includes(link.href));

    const sortedCommittees = [...committees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    return (
        <footer className="relative overflow-hidden bg-gradient-theme">
            {/* Decoratieve achtergrond-blob links */}
            <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-[var(--color-purple-200)]/10 blur-3xl" />
            {/* Decoratieve achtergrond-blob rechts */}
            <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-[var(--color-purple-100)]/10 blur-3xl" />

            <div className="relative mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">

                    {/* ── Kolom 1: Informatie ── */}
                    <div>
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
                                        className={`${LINK_CLS} bg-[var(--color-white)]/10`}
                                        title={doc.description !== null ? doc.description : undefined}
                                    >
                                        {doc.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Kolom 2: Pagina's ── */}
                    <div>
                        <h3 className={HEADING_CLS}>Pagina&apos;s</h3>
                        <ul className="space-y-2 text-sm">
                            {pageLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={LINK_CLS}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Kolom 3: Commissies ── */}
                    <div>
                        <h3 className={HEADING_CLS}>Commissies</h3>
                        <ul className="space-y-2 text-sm">
                            {sortedCommittees.length === 0 && (
                                <li className={MUTED_CLS}>Geen commissies gevonden</li>
                            )}
                            {sortedCommittees.map((committee) => {
                                const cleaned = cleanCommitteeName(committee.name);
                                const slug = slugify(cleaned);
                                return (
                                    <li key={committee.id}>
                                        <Link href={`${ROUTES.COMMITTEES}/commissies/${slug}`} className={LINK_CLS}>
                                            {cleaned}
                                        </Link>
                                    </li>
                                );
                            })}
                            <li>
                                <Link href={ROUTES.COMMITTEES} className={LINK_CLS}>
                                    Alle commissies bekijken
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ── Kolom 4: Contact & Social ── */}
                    <div>
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

                            {/* WhatsApp-link: uitsluitend zichtbaar voor ingelogde leden */}
                            {mounted && isAuthenticated && (
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
                                    href={ROUTES.STICKERS}
                                    className={
                                        'inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition ' +
                                        'bg-[var(--color-purple-500)]/20 text-[var(--color-purple-700)] ' +
                                        'dark:bg-[var(--color-white)]/15 dark:text-[var(--color-white)] ' +
                                        'hover:bg-[var(--color-purple-500)]/30 dark:hover:bg-[var(--color-white)]/25'
                                    }
                                >
                                    Safe Havens
                                </Link>
                            </li>
                        </ul>

                        <h3 className={HEADING_CLS}>Social Media</h3>
                        <div className="flex gap-3">
                            {/* Social-icons: white/10 bg werkt op zowel lichte als donkere footer */}
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-[var(--color-purple-500)]/15 dark:bg-[var(--color-white)]/10 ' +
                                    'text-[var(--color-purple-700)] dark:text-[var(--color-white)] ' +
                                    'hover:bg-[var(--color-purple-500)]/25 dark:hover:bg-[var(--color-white)]/20'
                                }
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-[var(--color-purple-500)]/15 dark:bg-[var(--color-white)]/10 ' +
                                    'text-[var(--color-purple-700)] dark:text-[var(--color-white)] ' +
                                    'hover:bg-[var(--color-purple-500)]/25 dark:hover:bg-[var(--color-white)]/20'
                                }
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
                                    'bg-[var(--color-purple-500)]/15 dark:bg-[var(--color-white)]/10 ' +
                                    'text-[var(--color-purple-700)] dark:text-[var(--color-white)] ' +
                                    'hover:bg-[var(--color-purple-500)]/25 dark:hover:bg-[var(--color-white)]/20'
                                }
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 text-center">
                    <p className={`text-sm ${MUTED_CLS}`}>
                        Copyright &copy; 2026 Salve Mundi &mdash; alle rechten voorbehouden.{' '}
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
