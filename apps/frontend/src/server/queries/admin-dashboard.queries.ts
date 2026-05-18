import 'server-only';
import { query } from '@/lib/database';
import { DashboardStatsSchema, type DashboardStats, type RecentActivity, RecentActivitySchema } from '@salvemundi/validations/schema/admin-dashboard.zod';
import { z } from 'zod';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';

interface DbDashboardRow {
    members?: unknown;
    events?: unknown;
    signups?: unknown;
    intro?: unknown;
    coupons?: unknown;
    errors?: unknown;
    stickers_total?: unknown;
    stickers_recent?: unknown;
}

interface DbCountRow {
    count?: unknown;
}

interface DbRecentActivityRow {
    id: string | number;
    name?: unknown;
    event_date?: unknown;
    signups?: unknown;
}

export async function getDashboardStatsInternal(): Promise<DashboardStats> {
    try {
        const { toLocalISOString } = await import('@/lib/utils/date-utils');
        const now = new Date();
        const today = toLocalISOString(now) as string;
        const lastWeek = toLocalISOString(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), true) as string;

        const excludedEmailsStr = EXCLUDED_EMAILS.map(e => `'${e}'`).join(',');
        const basicSql = `
            SELECT 
                (SELECT COUNT(*) FROM directus_users WHERE membership_status = 'active' AND membership_expiry >= $1 AND email NOT IN (${excludedEmailsStr})) as members,
                (SELECT COUNT(*) FROM events WHERE event_date >= $1) as events,
                (SELECT COUNT(*) FROM event_signups es JOIN events e ON es.event_id = e.id WHERE e.event_date >= $1 AND es.payment_status = 'paid') as signups,
                (SELECT COUNT(*) FROM intro_signups) as intro,
                (SELECT COUNT(*) FROM coupons WHERE is_active = true AND (valid_until IS NULL OR valid_until >= $1)) as coupons,
                (SELECT COUNT(*) FROM system_logs WHERE status = 'FAILED') as errors,
                (SELECT COUNT(*) FROM "Stickers") as stickers_total,
                (SELECT COUNT(*) FROM "Stickers" WHERE date_created >= $2) as stickers_recent
        `;

        const { rows: basicRows } = await query(basicSql, [today, lastWeek]);
        const b = basicRows[0] as DbDashboardRow;

        const pcSql = `
            SELECT COUNT(*) as count 
            FROM pub_crawl_signups 
            WHERE payment_status = 'paid' AND pub_crawl_event_id = (
                SELECT id FROM pub_crawl_events 
                WHERE date >= $1 
                ORDER BY date ASC 
                LIMIT 1
            )
        `;
        const { rows: pcRows } = await query(pcSql, [now.toISOString()]);
        const pcRow = (pcRows as DbCountRow[])[0];

        const tripSql = `
            SELECT COUNT(*) as count 
            FROM trip_signups 
            WHERE status != 'cancelled' AND trip_id = (
                SELECT id FROM trips 
                WHERE (end_date >= $1 OR start_date >= $1)
                ORDER BY start_date ASC 
                LIMIT 1
            )
        `;
        const { rows: tripRows } = await query(tripSql, [now.toISOString()]);
        const tripRow = (tripRows as DbCountRow[])[0];

        const totalStickers = Number(b.stickers_total || 0);
        const recentStickers = Number(b.stickers_recent || 0);
        const stickerGrowthRate = totalStickers > 0 ? Math.round((recentStickers / totalStickers) * 100) : 0;

        const stats = {
            totalMembers: Number(b.members || 0),
            upcomingEventsCount: Number(b.events || 0),
            pendingSignupsCount: Number(b.signups || 0),
            systemErrors: Number(b.errors || 0),
            introSignups: Number(b.intro || 0),
            totalCoupons: Number(b.coupons || 0),
            pubCrawlSignups: Number(pcRow.count || 0),
            reisSignups: Number(tripRow.count || 0),
            stickerGrowthRate
        };

        return DashboardStatsSchema.parse(stats);
    } catch (_error) {
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
        const sql = `
            SELECT 
                e.id, 
                e.name, 
                e.event_date,
                (SELECT COUNT(*) FROM event_signups es WHERE es.event_id = e.id AND es.payment_status = 'paid') as signups
            FROM events e
            ORDER BY e.event_date DESC
            LIMIT 4
        `;
        const { rows } = await query(sql);

        const mapped = (rows as DbRecentActivityRow[]).map(r => ({
            id: Number(r.id),
            name: typeof r.name === 'string' ? r.name : '',
            event_date: (typeof r.event_date === 'string' || r.event_date instanceof Date) ? new Date(r.event_date as string | Date).toISOString() : null,
            signups: Number(r.signups || 0)
        }));

        return z.array(RecentActivitySchema).parse(mapped);
    } catch (_error) {
        return [];
    }
}