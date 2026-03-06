import type { Document } from '@salvemundi/validations';

interface DocumentenLijstProps {
    /** Lijst van documenten opgehaald door de server action */
    documenten: Document[];
    /** Publieke Directus URL voor het opbouwen van asset-links */
    directusUrl: string;
}

/**
 * Geeft de lijst van downloadbare documenten weer (statuten, avg, etc.).
 * Pure server-component — geen client-state nodig.
 */
export default function DocumentenLijst({ documenten, directusUrl }: DocumentenLijstProps) {
    if (documenten.length === 0) {
        return (
            <p className="text-[var(--text-muted)] text-[var(--font-size-sm)]">
                Geen documenten beschikbaar
            </p>
        );
    }

    return (
        <div className="space-y-3 ml-14">
            {documenten.map((doc) => {
                // Asset-URL opbouwen via de publieke Directus URL
                const fileUrl = `${directusUrl}/assets/${doc.file}`;

                return (
                    <a
                        key={doc.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group"
                        title={doc.description ?? doc.title}
                    >
                        {/* Kleine pijl-animatie op hover */}
                        <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>{' '}
                        {doc.title}
                    </a>
                );
            })}
        </div>
    );
}
