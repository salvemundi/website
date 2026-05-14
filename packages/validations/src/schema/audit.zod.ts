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

export const QueueTaskSchema = z.object({
    email: z.string().email().optional().nullable(),
    userId: z.string().optional().nullable(),
    retries: z.number(),
    maxRetries: z.number(),
});

export type QueueTask = z.infer<typeof QueueTaskSchema>;

export const QueueInfoSchema = z.object({
    count: z.number(),
    samples: z.array(QueueTaskSchema),
});

export type QueueInfo = z.infer<typeof QueueInfoSchema>;

export const SystemLogSchema = z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    payload: z.record(z.any()).nullable(),
    created_at: z.string(),
});

export type SystemLog = z.infer<typeof SystemLogSchema>;
