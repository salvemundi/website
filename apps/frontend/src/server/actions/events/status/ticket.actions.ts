'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { db, schema } from '@salvemundi/db';
import { eq, desc, ilike } from 'drizzle-orm';
import { fetchUserEventSignupsDb } from '@/server/internal/event-db.utils';
import { fetchUserPubCrawlSignupsDb } from '@/server/internal/kroegentocht-db.utils';
import { safeConsoleError } from '@/server/utils/logger';

/**
 * Fetches the tickets (signups) for the current logged-in user.
 */
export async function getMyTickets() {
    const session = await getEnrichedSession();
    if (!session) return [];
    const email = session.user.email;

    try {
        const [eventSignups, pubCrawlSignups, tripSignupRows] = await Promise.all([
            fetchUserEventSignupsDb(email),
            fetchUserPubCrawlSignupsDb(email),
            db.select({
                id: schema.trip_signups.id,
                status: schema.trip_signups.status,
                created_at: schema.trip_signups.created_at,
                first_name: schema.trip_signups.first_name,
                last_name: schema.trip_signups.last_name,
                qr_token: schema.trip_signups.access_token,
                trip_id: schema.trips.id,
                trip_name: schema.trips.name,
                trip_event_date: schema.trips.start_date
            })
            .from(schema.trip_signups)
            .leftJoin(schema.trips, eq(schema.trip_signups.trip_id, schema.trips.id))
            .where(ilike(schema.trip_signups.email, email))
            .orderBy(desc(schema.trip_signups.created_at))
        ]);

        const tripSignups = tripSignupRows;

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
        safeConsoleError('[ticket.actions.ts][getMyTickets] Failed to fetch tickets:', error);
        return [];
    }
}
