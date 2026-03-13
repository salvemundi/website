import { z } from 'zod';

// Schema voor de 'documenten' collectie (statuten, avg, etc.) uit het ERD.
// Kolommen zijn strict snake_case conform de Datamodel ERD.
export const documentSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    // UUID van het bestand binnen Directus files
    file: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    display_order: z.number().int().nullable().optional(),
});

export const documentenSchema = z.array(documentSchema);

export type Document = z.infer<typeof documentSchema>;
