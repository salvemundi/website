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
    id: z.coerce.number(),
    name: z.string(),
    event_date: z.string().nullable(),
    signups: z.coerce.number()
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
