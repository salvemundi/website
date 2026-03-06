"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sponsorsSchema = exports.sponsorSchema = exports.activiteitenSchema = exports.activiteitSchema = exports.heroBannersSchema = exports.heroBannerSchema = void 0;
const zod_1 = require("zod");
// ─── Hero Banners ─────────────────────────────────────────────────────────────
// Valideert records uit de 'hero_banners' collectie in Directus.
// Kolommen zijn strict snake_case conform de Datamodel ERD.
exports.heroBannerSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    title: zod_1.z.string(),
    subtitle: zod_1.z.string().nullable().optional(),
    // UUID van het achtergrondplaatje binnen Directus Files
    afbeelding_id: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['draft', 'published', 'archived']),
    display_order: zod_1.z.number().int().default(0),
});
exports.heroBannersSchema = zod_1.z.array(exports.heroBannerSchema);
// ─── Activiteiten ─────────────────────────────────────────────────────────────
// Valideert records uit de 'activiteiten' collectie in Directus.
exports.activiteitSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    titel: zod_1.z.string(),
    beschrijving: zod_1.z.string().nullable().optional(),
    locatie: zod_1.z.string().nullable().optional(),
    datum_start: zod_1.z.string(), // ISO 8601 datetime string
    datum_eind: zod_1.z.string().nullable().optional(),
    // UUID van het preview-plaatje binnen Directus Files
    afbeelding_id: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['draft', 'published', 'archived']),
});
exports.activiteitenSchema = zod_1.z.array(exports.activiteitSchema);
// ─── Sponsors ─────────────────────────────────────────────────────────────────
// Valideert records uit de 'sponsors' collectie in Directus.
// `dark_bg` kan als boolean, integer (0/1) of string binnenkomen vanuit Directus;
// z.preprocess normaliseert dit naar een echte boolean.
const normalizeBool = (val) => {
    if (val === true || val === 1)
        return true;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'y';
    }
    return false;
};
exports.sponsorSchema = zod_1.z.object({
    sponsor_id: zod_1.z.number().int(),
    // `image` kan een UUID-string zijn of een object met een `id` veld
    image: zod_1.z
        .union([
        zod_1.z.string(),
        zod_1.z.object({ id: zod_1.z.string() }).transform((obj) => obj.id),
    ])
        .nullable()
        .optional(),
    website_url: zod_1.z.string().nullable().optional(),
    dark_bg: zod_1.z.preprocess(normalizeBool, zod_1.z.boolean()).default(false),
});
exports.sponsorsSchema = zod_1.z.array(exports.sponsorSchema);
