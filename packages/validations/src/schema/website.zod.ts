import { z } from 'zod';
import { selectDocumentsSchema, selectFeatureFlagsSchema } from './db.zod.js';

export const documentSchema = selectDocumentsSchema.extend({
    id: z.union([z.string(), z.number()]),
});

export const documentenSchema = z.array(documentSchema);

export const featureFlagSchema = selectFeatureFlagsSchema;

export const featureFlagsSchema = z.array(featureFlagSchema);

export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type Document = z.infer<typeof documentSchema>;
