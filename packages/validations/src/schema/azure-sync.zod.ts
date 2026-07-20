import { z } from 'zod';

export const azureGroupOwnerSchema = z.object({
    userId: z.string().uuid()
});

export const azureSyncRunSchema = z.object({
    fields: z.array(z.string()).optional(),
    activeOnly: z.boolean().optional(),
    silent: z.boolean().optional(),
    sendExpiryEmails: z.boolean().optional(),
    convertUpn: z.boolean().optional()
});
