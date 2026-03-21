import { z } from 'zod';

export * from './schema/finance.zod.js';
export * from './schema/members.zod.js';
export * from './schema/website.zod.js';
export * from './schema/home.zod.js';
export * from './schema/safe-havens.zod.js';
export * from './schema/activity.zod.js';
export * from './schema/azure-sync.zod.js';
export * from './schema/profiel.zod.js';
export * from './schema/committees.zod.js';
export * from './schema/mail.zod.js';
export * from './schema/admin-reis.zod.js';
export * from './schema/reis.zod.js';
export * from './schema/intro.zod.js';
export * from './schema/membership.zod.js';
export * from './schema/kroegentocht.zod.js';
export * from './schema/admin.zod.js';
export * from './schema/audit.zod.js';
export * from './schema/events.zod.js';
export * from './security.js';


import { memberSchema } from './schema/members.zod.js';
import { mollieWebhookSchema } from './schema/finance.zod.js';
import { documentSchema, featureFlagSchema } from './schema/website.zod.js';
import { heroBannerSchema, activiteitSchema, sponsorSchema } from './schema/home.zod.js';
import { safeHavenSchema } from './schema/safe-havens.zod.js';

export type Member = z.infer<typeof memberSchema>;
export type MollieWebhook = z.infer<typeof mollieWebhookSchema>;
export type Document = z.infer<typeof documentSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type HeroBanner = z.infer<typeof heroBannerSchema>;
export type Activiteit = z.infer<typeof activiteitSchema>;
export type Sponsor = z.infer<typeof sponsorSchema>;
export type SafeHaven = z.infer<typeof safeHavenSchema>;

import { BaseEventSchema, PaymentSuccessEventSchema, ActivitySignupEventSchema } from './schema/events.zod.js';
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type PaymentSuccessEvent = z.infer<typeof PaymentSuccessEventSchema>;
export type ActivitySignupEvent = z.infer<typeof ActivitySignupEventSchema>;


import { whatsappGroupSchema, transactionSchema, eventSignupSchema, updateProfileSchema } from './schema/profiel.zod.js';

export type WhatsAppGroup = z.infer<typeof whatsappGroupSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type EventSignup = z.infer<typeof eventSignupSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

import { tripSchema, tripSignupSchema, tripSignupActivitySchema } from './schema/admin-reis.zod.js';

export type Trip = z.infer<typeof tripSchema>;
export type TripSignup = z.infer<typeof tripSignupSchema>;
export type TripSignupActivity = z.infer<typeof tripSignupActivitySchema>;

import { reisSiteSettingsSchema, reisTripSchema, reisTripSignupSchema, reisSignupFormSchema } from './schema/reis.zod.js';

export type ReisSiteSettings = z.infer<typeof reisSiteSettingsSchema>;
export type ReisTrip = z.infer<typeof reisTripSchema>;
export type ReisTripSignup = z.infer<typeof reisTripSignupSchema>;
export type ReisSignupForm = z.infer<typeof reisSignupFormSchema>;

import {
    introSignupFormSchema,
    introParentSignupFormSchema,
    introBlogSchema,
    introPlanningSchema,
} from './schema/intro.zod.js';

export type IntroSignupForm = z.infer<typeof introSignupFormSchema>;
export type IntroParentSignupForm = z.infer<typeof introParentSignupFormSchema>;
export type IntroBlog = z.infer<typeof introBlogSchema>;
export type IntroPlanningItem = z.infer<typeof introPlanningSchema>;

import { signupSchema, validateCouponSchema, transactionStatusSchema } from './schema/membership.zod.js';

export type SignupFormData = z.infer<typeof signupSchema>;
export type ValidateCoupon = z.infer<typeof validateCouponSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

import { eventSignupFormSchema, activityAdminSchema } from './schema/activity.zod.js';
export type EventSignupForm = z.infer<typeof eventSignupFormSchema>;
export type ActivityAdminValue = z.infer<typeof activityAdminSchema>;
