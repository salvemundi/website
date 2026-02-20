
import Link from "next/link";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { slugify } from "@/shared/lib/utils/slug";
import { ROUTES } from "@/shared/lib/routes";
import { FooterDocuments, FooterWhatsAppLink, FooterLinks } from "./FooterClientElements";
import { getFooterCommittees, getFooterSettings } from "@/shared/api/footer-actions";
import { getDocumentsAction } from "@/shared/api/document-actions";

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

export default async function Footer() {
    // Fetch data on the server - much safer and avoids Entra hits on the client
    const [committeesData, settings, documents] = await Promise.all([
        getFooterCommittees(),
        getFooterSettings(),
        getDocumentsAction()
    ]);


    const committees = [...committeesData].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

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
                            {/* Auth-dependent Documents are handled by a client component */}
                            <FooterDocuments initialDocuments={documents} />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Pagina's</h3>
                        <FooterLinks initialSettings={settings} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-title mb-4">Commissies</h3>
                        <ul className="space-y-2 text-sm">
                            {committees.map((committee) => (
                                <li key={committee.id}>
                                    <Link
                                        href={`${ROUTES.COMMITTEES}/${slugify(cleanCommitteeName(committee.name))}`}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:text-theme-purple dark:hover:text-theme-purple-lighter"
                                    >
                                        {cleanCommitteeName(committee.name)}
                                    </Link>
                                </li>
                            ))}
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
                            {/* Auth-dependent WhatsApp Link handles its own visibility */}
                            <FooterWhatsAppLink />
                            <li>
                                <Link
                                    href={ROUTES.SAFE_HAVENS}
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-theme-purple-light/20 font-semibold transition hover:bg-theme-purple-light/30 hover:text-theme-text"
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
