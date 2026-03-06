import { z } from 'zod';

/**
 * Zod schema voor de 'safe_havens' collectie (Vertrouwenspersonen)
 * Conform het [GEÜPDATE] Datamodel ERD.
 */
export const safeHavenSchema = z.object({
    id: z.string().uuid(),
    naam: z.string(),
    email: z.string().email().nullable().optional(),
    telefoon: z.string().nullable().optional(),
    beschrijving: z.string().nullable().optional(),
    afbeelding_id: z.string().uuid().nullable().optional(),
    status: z.string(),
    sort: z.number().int().nullable().optional(),
});

export const safeHavensSchema = z.array(safeHavenSchema);

export type SafeHaven = z.infer<typeof safeHavenSchema>;
