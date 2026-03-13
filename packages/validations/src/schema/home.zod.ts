import { z } from 'zod';

// ─── Hero Banners ─────────────────────────────────────────────────────────────
// Valideert records uit de 'hero_banners' collectie in Directus.
// Kolommen zijn strict snake_case conform de Datamodel ERD.
export const heroBannerSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    // UUID van het achtergrondplaatje binnen Directus Files
    afbeelding_id: z.string().nullable().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    display_order: z.number().int().default(0),
});

export const heroBannersSchema = z.array(heroBannerSchema);

export type HeroBanner = z.infer<typeof heroBannerSchema>;

// ─── Activiteiten ─────────────────────────────────────────────────────────────
// Valideert records uit de 'activiteiten' collectie in Directus.
export const activiteitSchema = z.object({
    id: z.union([z.string(), z.number()]),
    titel: z.string(),
    beschrijving: z.string().nullable().optional(),
    locatie: z.string().nullable().optional(),
    datum_start: z.string(), // ISO 8601 datetime string
    datum_eind: z.string().nullable().optional(),
    // UUID van het preview-plaatje binnen Directus Files
    afbeelding_id: z.string().nullable().optional(),
    status: z.string().optional(),
    price_members: z.number().nullable().optional(),
    price_non_members: z.number().nullable().optional(),
    only_members: z.boolean().nullable().optional(),
    inschrijf_deadline: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
    committee_name: z.string().nullable().optional(),
    event_time: z.string().nullable().optional(),
    event_time_end: z.string().nullable().optional(),
});

export const activiteitenSchema = z.array(activiteitSchema);

export type Activiteit = z.infer<typeof activiteitSchema>;

// ─── Sponsors ─────────────────────────────────────────────────────────────────
// Valideert records uit de 'sponsors' collectie in Directus.
// `dark_bg` kan als boolean, integer (0/1) of string binnenkomen vanuit Directus;
// z.preprocess normaliseert dit naar een echte boolean.
const normalizeBool = (val: unknown): boolean => {
    if (val === true || val === 1) return true;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'y';
    }
    return false;
};

export const sponsorSchema = z.object({
    sponsor_id: z.number().int(),
    // `image` kan een UUID-string zijn of een object met een `id` veld
    image: z
        .union([
            z.string(),
            z.object({ id: z.string() }).transform((obj) => obj.id),
        ])
        .nullable()
        .optional(),
    website_url: z.string().nullable().optional(),
    dark_bg: z.preprocess(normalizeBool, z.boolean()).default(false),
});

export const sponsorsSchema = z.array(sponsorSchema);

export type Sponsor = z.infer<typeof sponsorSchema>;
