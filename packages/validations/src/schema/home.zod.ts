import { z } from 'zod';
import { selectHeroBannersSchema, selectSponsorsSchema } from './db.zod.js';

export const heroBannerSchema = selectHeroBannersSchema.extend({
    id: z.union([z.string(), z.number()]),
    afbeelding_id: z.union([
        z.string(),
        z.object({
            id: z.string(),
            type: z.string().nullable().optional()
        })
    ]).nullable().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    display_order: z.coerce.number().int().default(0),
});

export const heroBannersSchema = z.array(heroBannerSchema);

export type HeroBanner = z.infer<typeof heroBannerSchema>;

const normalizeBool = (val: unknown): boolean => {
    if (val === true || val === 1) return true;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'y';
    }
    return false;
};

export const sponsorSchema = selectSponsorsSchema.extend({
    sponsor_id: z.coerce.number().int(),
    image: z
        .union([
            z.string(),
            z.object({ id: z.string() }).transform((obj) => obj.id),
        ])
        .nullable()
        .optional(),
    dark_bg: z.preprocess(normalizeBool, z.boolean()).default(false),
});

export const sponsorsSchema = z.array(sponsorSchema);

export type Sponsor = z.infer<typeof sponsorSchema>;
