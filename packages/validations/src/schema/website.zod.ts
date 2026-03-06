import { z } from 'zod';

// Schema voor de 'documenten' collectie (statuten, avg, etc.) uit het ERD.
// Kolommen zijn strict snake_case conform de Datamodel ERD.
export const documentSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    description: z.string().nullable().optional(),
    // UUID van het bestand binnen Directus files
    file: z.string(),
    category: z.string(),
    display_order: z.number().int(),
});

export const documentenSchema = z.array(documentSchema);

export type Document = z.infer<typeof documentSchema>;
