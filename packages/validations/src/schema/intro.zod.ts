import { z } from 'zod';
import { dateOfBirthSchema, phoneNumberSchema } from './shared.zod.js';

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

// --- Admin Schemas ---

export const introSignupSchema = introSignupFormSchema.extend({
    id: z.number(),
    created_at: z.string().or(z.date()).optional(),
});

export type IntroSignup = z.infer<typeof introSignupSchema>;

export const introParentSignupSchema = z.object({
    id: z.number().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    telefoonnummer: z.string().optional(),
    motivation: z.string().optional(),
    created_at: z.string().or(z.date()).optional(),
});

export type IntroParentSignup = z.infer<typeof introParentSignupSchema>;

export const introBlogSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(1, 'Titel is verplicht'),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    content: z.string().min(1, 'Content is verplicht'),
    blog_type: z.enum(['update', 'pictures', 'event', 'announcement']).default('update'),
    image: z.any().optional(), // Can be Directus asset ID or object
    is_published: z.boolean().default(false),
    created_at: z.string().or(z.date()).optional(),
});

export type IntroBlog = z.infer<typeof introBlogSchema>;

export const introPlanningSchema = z.object({
    id: z.number().optional(),
    date: z.string().min(1, 'Datum is verplicht'),
    time_start: z.string().min(1, 'Starttijd is verplicht'),
    time_end: z.string().optional(),
    title: z.string().min(1, 'Titel is verplicht'),
    description: z.string().min(1, 'Beschrijving is verplicht'),
    location: z.string().optional(),
    day: z.string().optional(),
});

export type IntroPlanningItem = z.infer<typeof introPlanningSchema>;
