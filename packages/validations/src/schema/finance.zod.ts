import { z } from 'zod';

export const mollieWebhookSchema = z.object({
    id: z.string().startsWith('tr_'),
});

export const paymentIntentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
});
