import { z } from 'zod';

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
  coupon_code: z.string().nullable().optional(),
  registration: z.any().nullable().optional(),
  pub_crawl_signup: z.any().nullable().optional(),
  trip_signup: z.any().nullable().optional(),
});

export const eventSignupSchema = z.object({
  id: z.number().or(z.string()),
  created_at: z.string(),
  event_id: z.object({
    id: z.number().or(z.string()),
    name: z.string(),
    event_date: z.string(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
  }),
});
