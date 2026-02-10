'use client';

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { documentsApi, committeesApi } from "@/shared/lib/api/salvemundi";
import { slugify } from "@/shared/lib/utils/slug";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useSalvemundiSiteSettings } from "@/shared/lib/hooks/useSalvemundiApi";
import { ROUTES } from "@/shared/lib/routes";

interface Document {
    id: number;
    title: string;
    description?: string;
    file: string;
    category: string;
    display_order: number;
}

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

export default function Footer() {
    const { isAuthenticated } = useAuth();

    const { data: documents } = useQuery({
        queryKey: ['documents'],
        queryFn: documentsApi.getAll,
        enabled: isAuthenticated,
    });

    const { data: committeesData = [] } = useQuery<any[]>({
        queryKey: ['committees-with-members'],
        queryFn: () => committeesApi.getAllWithMembers(),
        staleTime: 5 * 60 * 1000
    });

    const { data: introSettings } = useSalvemundiSiteSettings('intro');
    const introEnabled = introSettings?.show ?? true;
    const { data: kroegentochtSettings } = useSalvemundiSiteSettings('kroegentocht');
    const kroegentochtEnabled = kroegentochtSettings?.show ?? true;
    const { data: reisSettings } = useSalvemundiSiteSettings('reis');
    const reisEnabled = reisSettings?.show ?? true;

    const committees = React.useMemo(() => {
        return [...committeesData].sort((a, b) => {
            const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
            const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

            if (aIsBestuur && !bIsBestuur) return -1;
            if (!aIsBestuur && bIsBestuur) return 1;
            return 0;
        });
    }, [committeesData]);

    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';

    return (
        <footer className="relative overflow-hidden bg-gradient-theme text-theme-text dark:text-theme-white">
            <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-theme-purple-light/10 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-theme-purple-lighter/10 blur-3xl" />

            <div className="relative mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Informatie</h3>
                        <ul className="space-y-2 text-sm text-theme-text-subtle dark:text-theme-text-subtle">
                            <li>Rachelsmolen 1</li>
                            <li>5612 MA Eindhoven</li>
                            <li>KvK nr. 70280606</li>
                            {documents && documents.length > 0 && (
                                documents.map((doc: Document) => {
                                    const fileUrl = `${directusUrl}/assets/${doc.file}`;
                                    return (
                                        <li key={doc.id}>
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-white/10  transition hover:bg-white/20 hover:text-theme-purple-lighter"
                                                title={doc.description || doc.title}
                                            >
                                                {doc.title}
                                            </a>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Pagina's</h3>
                        <ul className="space-y-2 text-sm">
                            {[
                                { label: "Home", href: ROUTES.HOME },
                                ...(introEnabled ? [{ label: "Intro", href: ROUTES.INTRO }] : []),
                                { label: "Activiteiten", href: ROUTES.ACTIVITIES },
                                { label: "Commissies", href: ROUTES.COMMITTEES },
                                { label: "Clubs", href: ROUTES.CLUBS },
                                { label: "Contact", href: ROUTES.CONTACT },
                                { label: "Safe Havens", href: ROUTES.SAFE_HAVENS },
                                { label: "Lidmaatschap", href: ROUTES.MEMBERSHIP },
                                ...(kroegentochtEnabled ? [{ label: "Kroegentocht", href: ROUTES.PUB_CRAWL }] : []),
                                ...(reisEnabled ? [{ label: "Reis", href: ROUTES.TRIP }] : []),
                                { label: "Stickers", href: ROUTES.STICKERS },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-theme-purple-lighter"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Commissies</h3>
                        <ul className="space-y-2 text-sm">
                            {committees.length > 0 ? (
                                committees.map((committee) => (
                                    <li key={committee.id}>
                                        <Link
                                            href={`${ROUTES.COMMITTEES}/${slugify(cleanCommitteeName(committee.name))}`}
                                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-theme-purple-lighter"
                                        >
                                            {cleanCommitteeName(committee.name)}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li className="text-theme-text-light dark:text-theme-text-light">Laden...</li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Contact</h3>
                        <ul className="space-y-2 text-sm mb-6">
                            <li>
                                <a
                                    href="mailto:info@salvemundi.nl"
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-theme-purple-lighter"
                                >
                                    info@salvemundi.nl
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+31624827777"
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-geel"
                                >
                                    +31 6 24827777
                                </a>
                            </li>
                            {isAuthenticated && (
                                <li>
                                    <a
                                        href="https://wa.me/31624827777"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-theme-purple-lighter"
                                    >
                                        WhatsApp
                                    </a>
                                </li>
                            )}
                            <li>
                                <Link
                                    href={ROUTES.SAFE_HAVENS}
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-theme-purple-light/20  font-semibold transition hover:bg-theme-purple-light/30 hover:text-theme-text"
                                >
                                    Safe Havens
                                </Link>
                            </li>
                        </ul>

                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Social Media</h3>
                        <div className="flex gap-3">
                            <a
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 text-center">
                    <p className="text-sm text-theme-text-muted dark:text-theme-text-muted">
                        Copyright © 2026 Salve Mundi - alle rechten voorbehouden.{" "}
                        <a
                            href="https://github.com/salvemundi/website"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-theme-purple-lighter"
                        >
                            Source code
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
