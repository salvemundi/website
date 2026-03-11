import { z } from 'zod';

export const azureGroupOwnerSchema = z.object({
    userId: z.string().uuid()
});

export const azureSyncRunSchema = z.object({
    // Optional: add fields if we want to support partial syncs in the future
});
