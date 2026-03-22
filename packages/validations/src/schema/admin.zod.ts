import { z } from 'zod';

export const DashboardStatsSchema = z.object({
    totalMembers: z.number(),
    upcomingEventsCount: z.number(),
    pendingSignupsCount: z.number(),
    systemErrors: z.number(),
    introSignups: z.number(),
    totalCoupons: z.number(),
    pubCrawlSignups: z.number(),
    reisSignups: z.number(),
    stickerGrowthRate: z.number().optional().default(0)
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const RecentActivitySchema = z.object({
    id: z.number(),
    name: z.string(),
    event_date: z.string().nullable(),
    signups: z.number()
});

export type RecentActivity = z.infer<typeof RecentActivitySchema>;

export const TopStickerSchema = z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    count: z.number()
});

export type TopSticker = z.infer<typeof TopStickerSchema>;

export const BirthdaySchema = z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    birthday: z.string(),
    isToday: z.boolean()
});

export type Birthday = z.infer<typeof BirthdaySchema>;

export const AdminActivitySchema = z.object({
    id: z.number(),
    name: z.string(),
    event_date: z.string(),
    event_date_end: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    max_sign_ups: z.number().optional().nullable(),
    price_members: z.number().optional().nullable(),
    price_non_members: z.number().optional().nullable(),
    registration_deadline: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    image: z.object({ id: z.string() }).optional().nullable(),
    committee_id: z.number().optional().nullable(),
    status: z.enum(['published', 'draft', 'archived', 'scheduled']).optional().nullable(),
    publish_date: z.string().optional().nullable(),
    signup_count: z.number().optional().default(0)
});

export type AdminActivity = z.infer<typeof AdminActivitySchema>;
