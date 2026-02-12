'use client';

// Force HMR refresh to fix stale react-query reference



import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusUrl } from '@/shared/lib/directus';
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
