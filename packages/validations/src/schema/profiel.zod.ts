import { z } from 'zod';
import { phoneNumberSchema } from './shared.zod.js';

export const whatsappGroupSchema = z.object({
  id: z.string().or(z.number()),
  name: z.string(),
  description: z.string().nullable().optional(),
  invite_link: z.string().url().or(z.string()),
  is_active: z.boolean().optional().nullable(),
});

export const transactionSchema = z.object({
  id: z.string().or(z.number()),
  created_at: z.string().optional().nullable(),
  date_created: z.string().optional().nullable(),
  product_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().or(z.string()).nullable().optional(),
  payment_status: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  transaction_type: z.string().nullable().optional(),
  product_type: z.string().nullable().optional(),
  coupon_code: z.string().nullable().optional(),
  registration: z.object({
    id: z.number().or(z.string()),
    qr_token: z.string().optional().nullable(),
    event_id: z.object({
      name: z.string(),
    }).optional().nullable(),
  }).nullable().optional(),
  pub_crawl_signup: z.object({
    id: z.number().or(z.string()),
    amount_tickets: z.number().optional().nullable(),
    qr_token: z.string().optional().nullable(),
    pub_crawl_event_id: z.object({
      name: z.string(),
    }).optional().nullable(),
  }).nullable().optional(),
  trip_signup: z.object({
    id: z.number().or(z.string()),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    trip_id: z.object({
      name: z.string().optional().nullable(),
      title: z.string().optional().nullable(),
    }).optional().nullable(),
  }).nullable().optional(),
});

export const eventSignupSchema = z.object({
  id: z.number().or(z.string()),
  created_at: z.string().optional().nullable(),
  participant_name: z.string().optional().nullable(),
  participant_email: z.string().optional().nullable(),
  payment_status: z.string().optional().nullable(),
  qr_token: z.string().optional().nullable(),
  directus_relations: z.string().optional().nullable(),
  event_id: z.object({
    id: z.number().or(z.string()),
    name: z.string(),
    event_date: z.string().optional().nullable(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
  }).nullable().optional(),
});

export const updateProfileSchema = z.object({
  minecraft_username: z.string().optional().nullable(),
  phone_number: phoneNumberSchema.optional().or(z.literal('')).nullable(),
});

export type WhatsAppGroup = z.infer<typeof whatsappGroupSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type EventSignup = z.infer<typeof eventSignupSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
