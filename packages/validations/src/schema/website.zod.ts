import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { documents as documentsTable, feature_flags as feature_flagsTable } from '@salvemundi/db/schema';

const selectDocumentsSchema = createSelectSchema(documentsTable);
const selectFeatureFlagsSchema = createSelectSchema(feature_flagsTable);

export const documentSchema = selectDocumentsSchema.extend({
    id: z.union([z.string(), z.number()]),
});

export const documentenSchema = z.array(documentSchema);

export const featureFlagSchema = selectFeatureFlagsSchema;

export const featureFlagsSchema = z.array(featureFlagSchema);

export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type Document = z.infer<typeof documentSchema>;
