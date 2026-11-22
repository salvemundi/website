import { z } from 'zod';
import { selectSafeHavensSchema } from './db.zod.js';

export const safeHavenSchema = selectSafeHavensSchema.omit({
    created_at: true,
    updated_at: true,
    user_id: true,
}).extend({
    id: z.union([z.string(), z.number()]),
});

export const safeHavensSchema = z.array(safeHavenSchema);

export type SafeHaven = z.infer<typeof safeHavenSchema>;
