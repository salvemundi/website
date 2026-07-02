import { z } from 'zod';

export const mollieWebhookSchema = z.object({
    id: z.string().startsWith('tr_'),
});

export const paymentIntentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
});

export const molliePaymentMetadataSchema = z.object({
    registrationId: z.union([z.string(), z.number()]).optional(),
    registrationType: z.string().optional(),
    userId: z.string().uuid().optional().nullable(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    isContribution: z.boolean().optional(),
    isNewMember: z.boolean().optional(),
    couponCode: z.string().optional().nullable(),
    paymentType: z.string().optional(),
});

export type MollieWebhook = z.infer<typeof mollieWebhookSchema>;
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;
export type MolliePaymentMetadata = z.infer<typeof molliePaymentMetadataSchema>;
