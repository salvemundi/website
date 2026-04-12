import { z } from 'zod';

export const mollieWebhookSchema = z.object({
    id: z.string().startsWith('tr_'),
});

export const paymentIntentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
});

export type MollieWebhook = z.infer<typeof mollieWebhookSchema>;
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;
