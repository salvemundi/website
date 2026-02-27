import { z } from 'zod';

export * from './schema/finance.zod.ts';
export * from './schema/members.zod.ts';

import { memberSchema } from './schema/members.zod.ts';
import { mollieWebhookSchema } from './schema/finance.zod.ts';

export type Member = z.infer<typeof memberSchema>;
export type MollieWebhook = z.infer<typeof mollieWebhookSchema>;
