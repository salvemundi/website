import { z } from 'zod';
import { dateOfBirthSchema, phoneNumberSchema } from './shared.zod.js';

/**
 * Schema for the membership signup form
 */
export const signupSchema = z.object({
    voornaam: z.string().min(1, 'Voornaam is verplicht'),
    tussenvoegsel: z.string().optional(),
    achternaam: z.string().min(1, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    geboortedatum: dateOfBirthSchema,
    telefoon: phoneNumberSchema,
    coupon: z.string().optional(),
});

/**
 * Type for the signup form data
 */
export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Schema for requesting a membership payment intent
 */
export const membershipPaymentIntentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for coupon validation requests
 */
export const validateCouponSchema = z.object({
    couponCode: z.string().min(1, 'Coupon code is verplicht'),
});

/**
 * Schema for transaction status retrieval
 */
export const transactionStatusSchema = z.object({
    id: z.string().min(1, 'Transactie ID is verplicht'),
});
