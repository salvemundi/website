import 'server-only';
import { DashboardStatsSchema, type DashboardStats, type RecentActivity, RecentActivitySchema } from '@salvemundi/validations/schema/admin-dashboard.zod';
import { z } from 'zod';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';
import { safeConsoleError } from '@/server/utils/logger';

export async function getDashboardStatsInternal(): Promise<DashboardStats> {
    try {
        const { toLocalISOString } = await import('@/lib/utils/date-utils');
        const now = new Date();
        const todayStr = toLocalISOString(now) as string;
        const lastWeekStr = toLocalISOString(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), true) as string;

        const { db, schema } = await import('@/lib/database/db');
        const { count, eq, and, gte, notInArray, isNull, or, sql } = await import('drizzle-orm');
        const { directus_users, events, event_signups, intro_signups, coupons, system_logs, Stickers, pub_crawl_signups, pub_crawl_events, trips, trip_signups } = schema;

        const [
            membersCount,
            eventsCount,
            signupsCount,
            introCount,
            couponsCount,
            errorsCount,
            stickersTotal,
            stickersRecent,
            pcCount,
            tripCount
        ] = await Promise.all([
            db.select({ count: count() }).from(directus_users).where(
                and(
                    eq(directus_users.membership_status, 'active'),
                    gte(directus_users.membership_expiry, todayStr),
                    notInArray(directus_users.email, EXCLUDED_EMAILS)
                )
            ),
            db.select({ count: count() }).from(events).where(
                gte(events.event_date, todayStr)
            ),
            db.select({ count: count() }).from(event_signups)
                .leftJoin(events, eq(event_signups.event_id, events.id))
                .where(
                    and(
                        gte(events.event_date, todayStr),
                        eq(event_signups.payment_status, 'paid')
                    )
                ),
            db.select({ count: count() }).from(intro_signups),
            db.select({ count: count() }).from(coupons).where(
                and(
                    eq(coupons.is_active, true),
                    or(
                        isNull(coupons.valid_until),
                        gte(coupons.valid_until, todayStr)
                    )
                )
            ),
            db.select({ count: count() }).from(system_logs).where(
                eq(system_logs.status, 'FAILED')
            ),
            db.select({ count: count() }).from(Stickers),
            db.select({ count: count() }).from(Stickers).where(
                gte(Stickers.date_created, lastWeekStr)
            ),
            db.select({ count: count() }).from(pub_crawl_signups)
                .where(
                    and(
                        eq(pub_crawl_signups.payment_status, 'paid'),
                        eq(pub_crawl_signups.pub_crawl_event_id, 
                            db.select({ id: pub_crawl_events.id }).from(pub_crawl_events)
                                .where(gte(pub_crawl_events.date, now.toISOString()))
                                .orderBy(pub_crawl_events.date)
                                .limit(1)
                        )
                    )
                ),
            db.select({ count: count() }).from(trip_signups)
                .where(
                    and(
                        sql`${trip_signups.status} != 'cancelled'`,
                        eq(trip_signups.trip_id,
                            db.select({ id: trips.id }).from(trips)
                                .where(or(gte(trips.end_date, now.toISOString()), gte(trips.start_date, now.toISOString())))
                                .orderBy(trips.start_date)
                                .limit(1)
                        )
                    )
                )
        ]);

        const totalStickers = stickersTotal[0]?.count || 0;
        const recentStickers = stickersRecent[0]?.count || 0;
        const stickerGrowthRate = totalStickers > 0 ? Math.round((recentStickers / totalStickers) * 100) : 0;

        const stats = {
            totalMembers: membersCount[0]?.count || 0,
            upcomingEventsCount: eventsCount[0]?.count || 0,
            pendingSignupsCount: signupsCount[0]?.count || 0,
            systemErrors: errorsCount[0]?.count || 0,
            introSignups: introCount[0]?.count || 0,
            totalCoupons: couponsCount[0]?.count || 0,
            pubCrawlSignups: pcCount[0]?.count || 0,
            reisSignups: tripCount[0]?.count || 0,
            stickerGrowthRate
        };

        return DashboardStatsSchema.parse(stats);
    } catch (error) {
        safeConsoleError('[admin-dashboard.queries.ts][getDashboardStatsInternal] ', error);
        return {
            totalMembers: 0,
            upcomingEventsCount: 0,
            pendingSignupsCount: 0,
            systemErrors: 0,
            introSignups: 0,
            totalCoupons: 0,
            pubCrawlSignups: 0,
            reisSignups: 0,
            stickerGrowthRate: 0
        };
    }
}

export async function getRecentActivitiesInternal(): Promise<RecentActivity[]> {
    try {
        const { db, schema } = await import('@/lib/database/db');
        const { desc, sql } = await import('drizzle-orm');
        const { events, event_signups } = schema;
        
        const rows = await db.select({
            id: events.id,
            name: events.name,
            event_date: events.event_date,
            signups: sql<number>`(SELECT COUNT(*) FROM ${event_signups} es WHERE es.event_id = ${events.id} AND es.payment_status = 'paid')`.mapWith(Number)
        })
        .from(events)
        .orderBy(desc(events.event_date))
        .limit(4);

        const mapped = rows.map(r => ({
            id: Number(r.id),
            name: typeof r.name === 'string' ? r.name : '',
            event_date: r.event_date ? new Date(r.event_date).toISOString() : null,
            signups: r.signups || 0
        }));

        return z.array(RecentActivitySchema).parse(mapped);
    } catch (error) {
        safeConsoleError('[admin-dashboard.queries.ts][getRecentActivitiesInternal] ', error);
        return [];
    }
}