import { z } from 'zod';

/**
 * Zod schema voor de 'safe_havens' collectie (Vertrouwenspersonen)
 * Conform het [GEÜPDATE] Datamodel ERD.
 */
export const safeHavenSchema = z.object({
    id: z.union([z.string(), z.number()]),
    naam: z.string(),
    email: z.string().email().nullable().optional(),
    telefoon: z.string().nullable().optional(),
    beschrijving: z.string().nullable().optional(),
    afbeelding_id: z.string().nullable().optional(),
    status: z.string().optional(),
    sort: z.number().int().nullable().optional(),
});

export const safeHavensSchema = z.array(safeHavenSchema);

export type SafeHaven = z.infer<typeof safeHavenSchema>;
