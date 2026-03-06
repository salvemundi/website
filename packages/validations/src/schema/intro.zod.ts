import { z } from 'zod';

export const introSignupFormSchema = z.object({
    voornaam: z.string().min(1, 'Voornaam is verplicht'),
    tussenvoegsel: z.string().optional(),
    achternaam: z.string().min(1, 'Achternaam is verplicht'),
    geboortedatum: z.string().min(1, 'Geboortedatum is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    telefoonnummer: z.string().min(10, 'Ongeldig telefoonnummer'),
    favorieteGif: z.string().url('Ongeldige URL').optional().or(z.literal('')),
    website: z.string().optional(),
});

export type IntroSignupForm = z.infer<typeof introSignupFormSchema>;

export const introParentSignupFormSchema = z.object({
    telefoonnummer: z.string().min(10, 'Ongeldig telefoonnummer'),
    motivation: z.string().min(1, 'Motivatie is verplicht'),
});

export type IntroParentSignupForm = z.infer<typeof introParentSignupFormSchema>;
