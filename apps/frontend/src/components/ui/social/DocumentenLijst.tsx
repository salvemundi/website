import type { Document } from '@salvemundi/validations/schema/website.zod';
import { getImageUrl } from '@/lib/utils/image-utils';

interface DocumentenLijstProps {
    /** Lijst van documenten opgehaald door de server action */
    documenten: Document[];
}

/**
 * Geeft de lijst van downloadbare documenten weer (statuten, avg, etc.).
 * Pure server-component — geen client-state nodig.
 */
export default function DocumentenLijst({ documenten }: DocumentenLijstProps) {
    if (documenten.length === 0) {
        return (
            <p className="text-sm text-(--text-muted)">
                Geen documenten beschikbaar
            </p>
        );
    }

    return (
        <div className="ml-14 space-y-1.5">
            {documenten.map((doc) => {
                // Asset-URL opbouwen via de publieke Directus URL
                const fileUrl = getImageUrl(doc.file) || '#';

                return (
                    <a
                        key={doc.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block w-fit text-(--text-muted) transition-colors hover:text-(--text-main)"
                        title={doc.description !== null ? doc.description : undefined}
                    >
                        {/* Kleine pijl-animatie op hover */}
                        <span className="inline-block transition-transform group-hover:translate-x-1">→</span>{' '}
                        {doc.title}
                    </a>
                );
            })}
        </div>
    );
}
