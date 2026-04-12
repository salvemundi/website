import { z } from 'zod';

export const PendingSignupSchema = z.object({
    id: z.string(),
    created_at: z.string(),
    email: z.string().email(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    product_name: z.string(),
    amount: z.number(),
    approval_status: z.enum(['pending', 'approved', 'rejected', 'auto_approved']),
    payment_status: z.string(),
    coupon_code: z.string().optional().nullable(),
    type: z.enum(['membership_new', 'membership_renewal'])
});

export type PendingSignup = z.infer<typeof PendingSignupSchema>;

export const AuditSettingsSchema = z.object({
    manual_approval: z.boolean().default(false)
});

export type AuditSettings = z.infer<typeof AuditSettingsSchema>;
