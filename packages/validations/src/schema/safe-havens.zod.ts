import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { safe_havens as safe_havensTable } from '@salvemundi/db/schema';

const selectSafeHavensSchema = createSelectSchema(safe_havensTable);

export const safeHavenSchema = selectSafeHavensSchema.omit({
    created_at: true,
    updated_at: true,
    user_id: true,
}).extend({
    id: z.union([z.string(), z.number()]),
});

export const safeHavensSchema = z.array(safeHavenSchema);

export type SafeHaven = z.infer<typeof safeHavenSchema>;
