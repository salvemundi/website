'use client';

import { directusUrl } from '@/shared/lib/directus';
import { useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { ROUTES } from '@/shared/lib/routes';
import Link from 'next/link';
import { useAuth } from '@/features/auth/providers/auth-provider';

interface Document {
    id: number;
    title: string;
    description?: string;
    file: string;
}

export function FooterDocuments({ initialDocuments = [] }: { initialDocuments?: Document[] }) {
    const { isAuthenticated } = useAuth();
    const documents = initialDocuments;

    if (!isAuthenticated || !documents || documents.length === 0) return null;

    return (
        <>
            {documents.map((doc: Document) => (
                <li key={doc.id}>
                    <a
                        href={`${directusUrl}/assets/${doc.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-white/10 transition hover:bg-white/20 hover:text-theme-purple-lighter"
                        title={doc.description || doc.title}
                    >
                        {doc.title}
                    </a>
                </li>
            ))}
        </>
    );
}

export function FooterWhatsAppLink() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    return (
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
    );
}

export function FooterLinks({ initialSettings = [] }: { initialSettings?: any[] }) {
    const { data: reactiveSettings } = useSalvemundiSiteSettings();

    const getSetting = (page: string) => {
        const reactive = Array.isArray(reactiveSettings) ? (reactiveSettings as any[]).find((s: any) => s.page === page) : null;
        if (reactive) return reactive.show;
        const initial = initialSettings.find(s => s.page === page);
        return initial?.show ?? true;
    };

    const introEnabled = getSetting('intro');
    const kroegentochtEnabled = getSetting('kroegentocht');
    const reisEnabled = getSetting('reis');

    const links = [
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
    ];

    return (
        <ul className="space-y-2 text-sm">
            {links.map((link) => (
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
    );
}
