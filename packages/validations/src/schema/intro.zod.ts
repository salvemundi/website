import { z } from 'zod';
import { dateOfBirthSchema, phoneNumberSchema } from './shared.zod.js';
import { selectIntroSignupsSchema, selectIntroParentSignupsSchema, selectIntroBlogsSchema, selectIntroPlanningSchema } from './db.zod.js';

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

export const introParentSignupDbSchema = selectIntroParentSignupsSchema.extend({
    id: z.coerce.number(),
    email: z.string().email(),
});

export type IntroParentSignupDb = z.infer<typeof introParentSignupDbSchema>;

export const introBlogSchema = selectIntroBlogsSchema.extend({
    id: z.coerce.number().optional(),
    title: z.string().min(1, 'Titel is verplicht'),
    content: z.string().min(1, 'Content is verplicht'),
    blog_type: z.enum(['update', 'pictures', 'event', 'announcement']).default('update'),
    image: z.any().optional(), // Can be Directus asset ID or object
    is_published: z.boolean().default(false),
});

export type IntroBlog = z.infer<typeof introBlogSchema>;

export const introPlanningSchema = selectIntroPlanningSchema.extend({
    id: z.coerce.number().optional(),
    date: z.string().min(1, 'Datum is verplicht'),
    time_start: z.string().min(1, 'Starttijd is verplicht'),
    title: z.string().min(1, 'Titel is verplicht'),
    description: z.string().min(1, 'Beschrijving is verplicht'),
});

export type IntroPlanningItem = z.infer<typeof introPlanningSchema>;
