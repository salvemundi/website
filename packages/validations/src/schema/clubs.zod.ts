import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { clubs as clubsTable } from '@salvemundi/db/schema';

const selectClubsSchema = createSelectSchema(clubsTable);

export const clubSchema = selectClubsSchema;
export const clubsSchema = z.array(clubSchema);

export type Club = z.infer<typeof clubSchema>;
