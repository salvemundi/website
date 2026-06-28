import { z } from 'zod';
import { selectSafeHavensSchema } from './db.zod.js';

export const safeHavenSchema = selectSafeHavensSchema.extend({
    id: z.union([z.string(), z.number()]),
});

export const safeHavensSchema = z.array(safeHavenSchema);

export type SafeHaven = z.infer<typeof safeHavenSchema>;
