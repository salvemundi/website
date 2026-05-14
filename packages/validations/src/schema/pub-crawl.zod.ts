import { z } from 'zod';

/**
 * Schema voor een Kroegentocht Evenement (pub_crawl_events)
 */
export const pubCrawlEventSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    description: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    image: z.string().nullable().optional(),
    date: z.coerce.string().nullable().optional(),
    show: z.boolean().nullable().optional().default(true), // Default to true if missing
    disabled_message: z.string().nullable().optional(),
    price: z.number().optional().default(1),
    max_tickets_per_person: z.number().optional().default(10),
});

/**
 * Schema voor een individuele deelnemer (onderdeel van signup)
 */
export const pubCrawlParticipantSchema = z.object({
    name: z.string().min(1, 'Naam is verplicht'),
    initial: z.string().length(1, 'Voorletter achternaam is één letter'),
});

/**
 * Schema voor een Kroegentocht Inschrijving (pub_crawl_signups)
 */
export const pubCrawlSignupSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1, 'Naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    association: z.string().min(1, 'Vereniging is verplicht'),
    amount_tickets: z.number().min(1).max(10),
    pub_crawl_event_id: z.union([z.string(), z.number()]),
    name_initials: z.string(), // JSON string voor legacy compatibiliteit
    payment_status: z.enum(['open', 'paid', 'failed', 'canceled', 'expired']).default('open'),
    directus_relations: z.string().optional().nullable(),
    website: z.string().optional(), // Honeypot
});

/**
 * Schema voor een Kroegentocht Ticket (pub_crawl_tickets)
 */
export const pubCrawlTicketSchema = z.object({
    id: z.union([z.string(), z.number()]),
    signup_id: z.union([z.string(), z.number()]),
    name: z.string(),
    initial: z.string().length(1),
    qr_token: z.string(),
    checked_in: z.boolean().default(false),
    checked_in_at: z.string().nullable().optional(),
});

export const pubCrawlSignupFormSchema = z.object({
    email: z.string().email('Ongeldig e-mailadres'),
    association: z.string().min(1, 'Vereniging is verplicht'),
    customAssociation: z.string().optional(),
    amount_tickets: z.number().min(1, 'Minimaal 1 ticket').max(10, 'Maximaal 10 tickets'),
    participants: z.array(pubCrawlParticipantSchema).min(1),
    website: z.string().optional(), // Honeypot
    pub_crawl_event_id: z.union([z.string(), z.number()]),
}).refine((data) => {
    if (data.association === 'Anders' && (!data.customAssociation || data.customAssociation.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'Naam van de vereniging is verplicht',
    path: ['customAssociation'],
});

export type PubCrawlEvent = z.infer<typeof pubCrawlEventSchema>;
export type PubCrawlParticipant = z.infer<typeof pubCrawlParticipantSchema>;
export type PubCrawlSignup = z.infer<typeof pubCrawlSignupSchema>;
export type PubCrawlSignupForm = z.infer<typeof pubCrawlSignupFormSchema>;
export type PubCrawlTicket = z.infer<typeof pubCrawlTicketSchema>;
