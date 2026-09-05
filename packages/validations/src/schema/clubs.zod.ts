import { z } from 'zod';
import { selectClubsSchema } from './db.zod.js';

export const clubSchema = selectClubsSchema;
export const clubsSchema = z.array(clubSchema);

export type Club = z.infer<typeof clubSchema>;
