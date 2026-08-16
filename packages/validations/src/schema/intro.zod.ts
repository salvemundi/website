import { z } from 'zod';
import { dateOfBirthSchema, phoneNumberSchema } from './shared.zod.js';
import { selectIntroSignupsSchema, selectIntroParentSignupsSchema, selectIntroBlogsSchema, selectIntroPlanningSchema, selectIntroConfidantsSchema } from './db.zod.js';

export const introSignupFormSchema = z.object({
    voornaam: z.string().min(1, 'Voornaam is verplicht'),
    tussenvoegsel: z.string().optional(),
    achternaam: z.string().min(1, 'Achternaam is verplicht'),
    geboortedatum: dateOfBirthSchema,
    email: z.string().email('Ongeldig e-mailadres'),
    telefoonnummer: phoneNumberSchema,
    favorieteGif: z.string().url('Ongeldige URL').optional().or(z.literal('')),
    website: z.string().optional(),
});

export type IntroSignupForm = z.infer<typeof introSignupFormSchema>;

export const introParentSignupFormSchema = z.object({
    telefoonnummer: phoneNumberSchema,
    motivation: z.string().min(1, 'Motivatie is verplicht'),
});

export type IntroParentSignupForm = z.infer<typeof introParentSignupFormSchema>;

// --- Admin Schemas (Direct DB Mapping) ---

export const introSignupDbSchema = selectIntroSignupsSchema.extend({
    id: z.coerce.number(),
    email: z.string().email(),
    status: z.string().nullable().optional().default('registered'),
    approved: z.boolean().nullable().optional().default(false),
});

export type IntroSignupDb = z.infer<typeof introSignupDbSchema>;

export const introParentSignupDbSchema = selectIntroParentSignupsSchema.omit({
    date_updated: true,
    user_created: true,
    user_updated: true,
}).extend({
    id: z.coerce.number(),
    email: z.string().email(),
});

export type IntroParentSignupDb = z.infer<typeof introParentSignupDbSchema>;

export const introBlogSchema = selectIntroBlogsSchema.omit({
    date_updated: true,
    user_created: true,
    user_updated: true,
}).partial({
    status: true,
    sort: true,
    slug: true,
    excerpt: true,
    meta_title: true,
    meta_description: true,
    views_count: true,
    created_at: true,
    updated_at: true,
    likes: true,
}).extend({
    id: z.coerce.number().optional(),
    title: z.string().min(1, 'Titel is verplicht'),
    content: z.string().min(1, 'Content is verplicht'),
    blog_type: z.enum(['update', 'pictures', 'event', 'announcement']).default('update'),
    image: z.any().optional(), // Can be Directus asset ID or object
    is_published: z.boolean().default(false),
});

export type IntroBlog = z.infer<typeof introBlogSchema>;

export const introPlanningSchema = selectIntroPlanningSchema.omit({
    date_created: true,
    date_updated: true,
    user_created: true,
    user_updated: true,
}).partial({
    status: true,
    sort: true,
    day: true,
    time_end: true,
    location: true,
    sort_order: true,
    color: true,
    capacity: true,
    signup_required: true,
    created_at: true,
    updated_at: true,
    icon: true,
    is_mandatory: true,
    description: true,
}).extend({
    id: z.coerce.number(),
    date: z.string().min(1, 'Datum is verplicht'),
    time_start: z.string().min(1, 'Starttijd is verplicht'),
    title: z.string().min(1, 'Titel is verplicht'),
    description: z.string().nullable().optional(),
});

export const introPlanningFormSchema = introPlanningSchema.omit({ id: true });
export type IntroPlanningItem = z.infer<typeof introPlanningSchema>;
export type IntroPlanningForm = z.infer<typeof introPlanningFormSchema>;

export const introConfidantSchema = selectIntroConfidantsSchema.omit({
    created_at: true,
    updated_at: true,
}).partial({
    phone_number: true,
    image: true,
    sort_order: true,
    is_active: true,
}).extend({
    id: z.coerce.number(),
    name: z.string().min(1, 'Naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres').nullable().optional().or(z.literal('')),
    bio: z.string().nullable().optional(),
});

export const introConfidantFormSchema = introConfidantSchema.omit({ id: true });
export type IntroConfidant = z.infer<typeof introConfidantSchema>;
export type IntroConfidantForm = z.infer<typeof introConfidantFormSchema>;

