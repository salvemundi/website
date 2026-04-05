import { query } from '@/lib/db';
import { DashboardStatsSchema, type DashboardStats } from '@salvemundi/validations';

/**
 * High-performance dashboard statistics using direct SQL.
 * Bypasses Directus API and cache for immediate consistency.
 */
export async function getDashboardStatsInternal(): Promise<DashboardStats> {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Basic counts in a single multi-query
        const basicSql = `
            SELECT 
                (SELECT COUNT(*) FROM directus_users WHERE status = 'active' AND (membership_expiry IS NULL OR membership_expiry >= $1)) as members,
                (SELECT COUNT(*) FROM events WHERE event_date >= $1) as events,
                (SELECT COUNT(*) FROM event_signups es JOIN events e ON es.event_id = e.id WHERE e.event_date >= $1) as signups,
                (SELECT COUNT(*) FROM intro_signups) as intro,
                (SELECT COUNT(*) FROM coupons WHERE is_active = true AND (valid_until IS NULL OR valid_until >= $1)) as coupons,
                (SELECT COUNT(*) FROM system_logs WHERE status = 'FAILED') as errors,
                (SELECT COUNT(*) FROM "Stickers") as stickers_total,
                (SELECT COUNT(*) FROM "Stickers" WHERE date_created >= $2) as stickers_recent
        `;
        
        const { rows: basicRows } = await query(basicSql, [today, lastWeek]);
        const b = basicRows[0];

        // 2. Specialized counts for Trips and Pub Crawl
        // These are slightly more complex as they depend on "current/upcoming" logic
        
        // Upcoming Pub Crawl Signups
        const pcSql = `
            SELECT COUNT(*) as count 
            FROM pub_crawl_signups 
            WHERE pub_crawl_event_id = (
                SELECT id FROM pub_crawl_events 
                WHERE date >= $1 
                ORDER BY date ASC 
                LIMIT 1
            )
        `;
        const { rows: pcRows } = await query(pcSql, [now.toISOString()]);
        
        // Active Trip Signups
        const tripSql = `
            SELECT COUNT(*) as count 
            FROM trip_signups 
            WHERE status != 'cancelled' AND trip_id = (
                SELECT id FROM trips 
                WHERE (end_date >= $1 OR event_date >= $1 OR start_date >= $1)
                ORDER BY start_date ASC 
                LIMIT 1
            )
        `;
        const { rows: tripRows } = await query(tripSql, [now.toISOString()]);

        const totalStickers = Number(b?.stickers_total || 0);
        const recentStickers = Number(b?.stickers_recent || 0);
        const stickerGrowthRate = totalStickers > 0 ? Math.round((recentStickers / totalStickers) * 100) : 0;

        const stats = {
            totalMembers: Number(b?.members || 0),
            upcomingEventsCount: Number(b?.events || 0),
            pendingSignupsCount: Number(b?.signups || 0),
            systemErrors: Number(b?.errors || 0),
            introSignups: Number(b?.intro || 0),
            totalCoupons: Number(b?.coupons || 0),
            pubCrawlSignups: Number(pcRows?.[0]?.count || 0),
            reisSignups: Number(tripRows?.[0]?.count || 0),
            stickerGrowthRate
        };

        return DashboardStatsSchema.parse(stats);
    } catch (error) {
        console.error('[AdminDashboardQueries] getDashboardStatsInternal failed:', error);
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
