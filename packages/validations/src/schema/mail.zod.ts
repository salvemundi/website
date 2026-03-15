import { z } from 'zod';

export const MailRequestSchema = z.object({
    to: z.string().email(),
    templateId: z.string(),
    data: z.record(z.any()).optional()
});

export type MailRequest = z.infer<typeof MailRequestSchema>;
