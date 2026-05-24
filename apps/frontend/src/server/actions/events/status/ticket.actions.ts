'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { query } from '@/lib/database';
import { fetchUserEventSignupsDb } from '@/server/internal/event-db.utils';
import { fetchUserPubCrawlSignupsDb } from '@/server/internal/kroegentocht-db.utils';
import { safeConsoleError } from '@/server/utils/logger';

interface DbTripSignupRow {
    id: number;
    status: string;
    created_at: string | null;
    first_name: string | null;
    last_name: string | null;
    qr_token: string | null;
    trip_id: number | null;
    trip_name: string | null;
    trip_event_date: string | null;
}

/**
 * Fetches the tickets (signups) for the current logged-in user.
 */
export async function getMyTickets() {
    const session = await getEnrichedSession();
    if (!session) return [];
    const email = session.user.email;

    try {
        const [eventSignups, pubCrawlSignups, tripSignupsResult] = await Promise.all([
            fetchUserEventSignupsDb(email),
            fetchUserPubCrawlSignupsDb(email),
            query(`
                SELECT ts.id, ts.status, ts.created_at, ts.first_name, ts.last_name, ts.access_token as qr_token,
                       t.id as trip_id, t.name as trip_name, t.start_date as trip_event_date
                FROM trip_signups ts
                LEFT JOIN trips t ON ts.trip_id = t.id
                WHERE LOWER(ts.email) = LOWER($1)
                ORDER BY ts.created_at DESC
            `, [email])
        ]);

        const tripSignups = tripSignupsResult.rows as DbTripSignupRow[];

        const formattedPubCrawl = pubCrawlSignups.map(s => ({
            ...s,
            id: s.id as number,
            date_created: s.created_at ? String(s.created_at) : undefined,
            type: 'pub_crawl' as const,
            qr_token: s.qr_token || '',
            participant_name: s.name || undefined,
            event_id: {
                name: s.pub_crawl_event_id.name || undefined,
                event_date: s.pub_crawl_event_id.date ? String(s.pub_crawl_event_id.date) : undefined,
                location: undefined
            }
        }));

        const formattedEvents = eventSignups.map(s => ({
            ...s,
            id: s.id as number,
            date_created: s.created_at ? String(s.created_at) : undefined,
            type: 'event' as const,
            qr_token: s.qr_token || '',
            participant_name: s.participant_name || undefined,
            event_id: {
                name: s.event_id.name || undefined,
                event_date: s.event_id.event_date ? String(s.event_id.event_date) : undefined,
                location: s.event_id.location || undefined
            }
        }));

        const formattedTrips = tripSignups.map(s => {
            return {
                ...s,
                id: s.id as number,
                date_created: s.created_at ? String(s.created_at) : undefined,
                event_id: {
                    id: s.trip_id as number,
                    name: s.trip_name || undefined,
                    event_date: s.trip_event_date || undefined,
                    location: undefined
                },
                type: 'trip' as const,
                qr_token: s.qr_token || '',
                participant_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || undefined
            };
        });

        return [...formattedEvents, ...formattedPubCrawl, ...formattedTrips].sort((a, b) => {
            const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
            const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
            return dateB - dateA;
        });
    } catch (error: unknown) {
        safeConsoleError('[ticket.actions][getMyTickets] Failed to fetch tickets:', error);
        return [];
    }
}
