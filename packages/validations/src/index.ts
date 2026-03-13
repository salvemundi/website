import { z } from 'zod';

export * from './schema/finance.zod';
export * from './schema/members.zod';
export * from './schema/website.zod';
export * from './schema/home.zod';
export * from './schema/safe-havens.zod';
export * from './schema/activity.zod';
export * from './schema/azure-sync.zod';


import { memberSchema } from './schema/members.zod';
import { mollieWebhookSchema } from './schema/finance.zod';
import { documentSchema, featureFlagSchema } from './schema/website.zod';
import { heroBannerSchema, activiteitSchema, sponsorSchema } from './schema/home.zod';
import { safeHavenSchema } from './schema/safe-havens.zod';

export type Member = z.infer<typeof memberSchema>;
export type MollieWebhook = z.infer<typeof mollieWebhookSchema>;
export type Document = z.infer<typeof documentSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type HeroBanner = z.infer<typeof heroBannerSchema>;
export type Activiteit = z.infer<typeof activiteitSchema>;
export type Sponsor = z.infer<typeof sponsorSchema>;
export type SafeHaven = z.infer<typeof safeHavenSchema>;

export * from './schema/admin-reis.zod';
import { tripSchema, tripSignupSchema, tripSignupActivitySchema } from './schema/admin-reis.zod';

export type Trip = z.infer<typeof tripSchema>;
export type TripSignup = z.infer<typeof tripSignupSchema>;
export type TripSignupActivity = z.infer<typeof tripSignupActivitySchema>;

export * from './schema/reis.zod';
import { reisSiteSettingsSchema, reisTripSchema, reisTripSignupSchema, reisSignupFormSchema } from './schema/reis.zod';

export type ReisSiteSettings = z.infer<typeof reisSiteSettingsSchema>;
export type ReisTrip = z.infer<typeof reisTripSchema>;
export type ReisTripSignup = z.infer<typeof reisTripSignupSchema>;
export type ReisSignupForm = z.infer<typeof reisSignupFormSchema>;

export * from './schema/intro.zod';
import { introSignupFormSchema, introParentSignupFormSchema } from './schema/intro.zod';

export type IntroSignupForm = z.infer<typeof introSignupFormSchema>;
export type IntroParentSignupForm = z.infer<typeof introParentSignupFormSchema>;

export * from './schema/membership.zod';
import { signupSchema, validateCouponSchema, transactionStatusSchema } from './schema/membership.zod';

export type SignupFormData = z.infer<typeof signupSchema>;
export type ValidateCoupon = z.infer<typeof validateCouponSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
