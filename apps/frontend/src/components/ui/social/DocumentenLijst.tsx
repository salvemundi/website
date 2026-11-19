import { Anchor, Stack, Text } from '@mantine/core';
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
            <Text size="sm" c="dimmed">
                Geen documenten beschikbaar
            </Text>
        );
    }

    return (
        <Stack gap={6} pl="xl">
            {documenten.map((doc) => {
                const fileUrl = getImageUrl(doc.file) || '#';

                return (
                    <Anchor
                        key={doc.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        c="dimmed"
                        underline="hover"
                        w="fit-content"
                        title={doc.description !== null ? doc.description : undefined}
                    >
                        → {doc.title}
                    </Anchor>
                );
            })}
        </Stack>
    );
}
