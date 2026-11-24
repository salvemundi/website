import 'server-only';
import { db, schema } from '@salvemundi/db';
import { and, eq, gte, lt, ne, or, sql } from 'drizzle-orm';
import { type SamuWrappedStats, type WrappedNamedCount, type WrappedPersona } from '@/lib/wrapped/samu-wrapped.types';

export const SAMU_WRAPPED_FLAG = 'samu_wrapped';

// Fontys Rachelsmolen, Eindhoven — referentiepunt voor "verste sticker"
const HOME_LAT = 51.4511;
const HOME_LNG = 5.48;

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

/** Minimaal aantal actieve deelnemers voordat we een percentiel tonen (anders zegt het niks). */
const MIN_PARTICIPANTS_FOR_PERCENTILE = 10;

export async function isSamuWrappedEnabledInternal(): Promise<boolean> {
    const rows = await db
        .select({ is_active: schema.feature_flags.is_active })
        .from(schema.feature_flags)
        .where(eq(schema.feature_flags.name, SAMU_WRAPPED_FLAG))
        .limit(1);
    return rows[0]?.is_active ?? false;
}

/** In januari en februari kijken we terug op het vorige jaar. */
export function getDefaultWrappedYear(now: Date = new Date()): number {
    return now.getMonth() <= 1 ? now.getFullYear() - 1 : now.getFullYear();
}

function topOf(values: string[]): WrappedNamedCount | null {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    let best: WrappedNamedCount | null = null;
    for (const [name, count] of counts) {
        if (!best || count > best.count) best = { name, count };
    }
    return best;
}

function toDateOnly(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.slice(0, 10);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface WrappedUserInput {
    id: string;
    email: string;
    firstName: string;
}

export async function getSamuWrappedStatsInternal(user: WrappedUserInput, year: number): Promise<SamuWrappedStats> {
    const start = `${year}-01-01`;
    const end = `${year + 1}-01-01`;
    const email = user.email.toLowerCase();

    const [eventRows, pubCrawlRows, stickerRows, stickerAllTime, tripRows, merchRows, committeeRows, spentRows, userRows] = await Promise.all([
        db.select({
            name: schema.events.name,
            date: schema.events.event_date,
            location: schema.events.location,
            checkedIn: schema.event_signups.checked_in,
            committee: schema.committees.name
        })
            .from(schema.event_signups)
            .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
            .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
            .where(and(
                or(
                    sql`LOWER(${schema.event_signups.participant_email}) = ${email}`,
                    eq(schema.event_signups.directus_relations, user.id)
                ),
                eq(schema.event_signups.payment_status, 'paid'),
                gte(schema.events.event_date, start),
                lt(schema.events.event_date, end)
            )),

        db.select({
            id: schema.pub_crawl_signups.id,
            tickets: schema.pub_crawl_signups.amount_tickets
        })
            .from(schema.pub_crawl_signups)
            .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
            .where(and(
                or(
                    sql`LOWER(${schema.pub_crawl_signups.email}) = ${email}`,
                    eq(schema.pub_crawl_signups.directus_relations, user.id)
                ),
                eq(schema.pub_crawl_signups.payment_status, 'paid'),
                sql`COALESCE(${schema.pub_crawl_events.date}, ${schema.pub_crawl_signups.created_at}) >= ${start}::date`,
                sql`COALESCE(${schema.pub_crawl_events.date}, ${schema.pub_crawl_signups.created_at}) < ${end}::date`
            )),

        db.select({
            locationName: schema.Stickers.location_name,
            city: schema.Stickers.city,
            country: schema.Stickers.country,
            lat: schema.Stickers.latitude,
            lng: schema.Stickers.longitude
        })
            .from(schema.Stickers)
            .where(and(
                eq(schema.Stickers.user_created, user.id),
                gte(schema.Stickers.date_created, start),
                lt(schema.Stickers.date_created, end)
            )),

        db.select({ value: sql<number>`COUNT(*)::int` })
            .from(schema.Stickers)
            .where(eq(schema.Stickers.user_created, user.id)),

        db.select({ name: schema.trips.name })
            .from(schema.trip_signups)
            .innerJoin(schema.trips, eq(schema.trip_signups.trip_id, schema.trips.id))
            .where(and(
                or(
                    sql`LOWER(${schema.trip_signups.email}) = ${email}`,
                    eq(schema.trip_signups.directus_relations, user.id)
                ),
                ne(schema.trip_signups.status, 'cancelled'),
                ne(schema.trip_signups.status, 'waitlist'),
                gte(schema.trips.start_date, start),
                lt(schema.trips.start_date, end)
            )),

        db.select({ items: sql<number>`COALESCE(SUM(${schema.webshop_preorder_lines.quantity}), 0)::int` })
            .from(schema.webshop_preorders)
            .innerJoin(schema.webshop_preorder_lines, eq(schema.webshop_preorder_lines.preorder_id, schema.webshop_preorders.id))
            .where(and(
                or(
                    eq(schema.webshop_preorders.user_id, user.id),
                    sql`LOWER(${schema.webshop_preorders.email}) = ${email}`
                ),
                eq(schema.webshop_preorders.deposit_paid, true),
                gte(schema.webshop_preorders.created_at, start),
                lt(schema.webshop_preorders.created_at, end)
            )),

        db.select({
            name: schema.committees.name,
            isLeader: schema.committee_members.is_leader
        })
            .from(schema.committee_members)
            .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
            .where(eq(schema.committee_members.user_id, user.id)),

        db.select({ total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)::float` })
            .from(schema.transactions)
            .where(and(
                or(
                    eq(schema.transactions.user_id, user.id),
                    sql`LOWER(${schema.transactions.email}) = ${email}`
                ),
                eq(schema.transactions.payment_status, 'paid'),
                gte(schema.transactions.created_at, start),
                lt(schema.transactions.created_at, end)
            )),

        db.select({ memberSince: schema.directus_users.originele_betaaldatum, firstName: schema.directus_users.first_name })
            .from(schema.directus_users)
            .where(eq(schema.directus_users.id, user.id))
            .limit(1)
    ]);

    // ── Activiteiten ────────────────────────────────────────────────
    const sortedEvents = [...eventRows].sort((a, b) => a.date.localeCompare(b.date));
    const firstEvent = sortedEvents.at(0);
    const lastEvent = sortedEvents.at(-1);

    const monthNames = sortedEvents.map((e) => MONTHS[Number(e.date.slice(5, 7)) - 1] ?? '');
    const weekdayNames = sortedEvents.map((e) => {
        const [y, m, d] = e.date.slice(0, 10).split('-').map(Number);
        return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? '';
    });
    const committeeNames = sortedEvents.map((e) => e.committee).filter((c): c is string => !!c);
    const locations = new Set(sortedEvents.map((e) => e.location?.trim().toLowerCase()).filter(Boolean));

    const topPercent = sortedEvents.length > 0 ? await getActivityTopPercent(sortedEvents.length, start, end) : null;

    // ── Stickers ────────────────────────────────────────────────────
    let farthest: SamuWrappedStats['stickers']['farthest'] = null;
    for (const s of stickerRows) {
        if (s.lat === null || s.lng === null) continue;
        const km = haversineKm(HOME_LAT, HOME_LNG, s.lat, s.lng);
        if (!farthest || km > farthest.distanceKm) {
            farthest = {
                place: s.city || s.locationName || s.country || 'Onbekende plek',
                distanceKm: Math.round(km)
            };
        }
    }
    const cities = new Set(stickerRows.map((s) => s.city?.trim().toLowerCase()).filter(Boolean));
    const countries = new Set(stickerRows.map((s) => s.country?.trim().toLowerCase()).filter(Boolean));

    // ── Lidmaatschap ────────────────────────────────────────────────
    const memberSince = toDateOnly(userRows[0]?.memberSince ?? null);
    const daysMember = memberSince
        ? Math.max(0, Math.floor((Date.now() - new Date(`${memberSince}T00:00:00Z`).getTime()) / 86_400_000))
        : null;

    const stats: Omit<SamuWrappedStats, 'persona'> = {
        year,
        firstName: userRows[0]?.firstName?.trim() || user.firstName,
        activities: {
            total: sortedEvents.length,
            checkedIn: sortedEvents.filter((e) => e.checkedIn).length,
            firstEvent: firstEvent ? { name: firstEvent.name, date: firstEvent.date.slice(0, 10) } : null,
            lastEvent: lastEvent && sortedEvents.length > 1 ? { name: lastEvent.name, date: lastEvent.date.slice(0, 10) } : null,
            topCommittee: topOf(committeeNames),
            busiestMonth: topOf(monthNames),
            favoriteWeekday: topOf(weekdayNames),
            distinctLocations: locations.size,
            topPercent
        },
        pubCrawls: {
            total: pubCrawlRows.length,
            tickets: pubCrawlRows.reduce((sum, r) => sum + (r.tickets ?? 1), 0)
        },
        stickers: {
            total: stickerRows.length,
            allTime: stickerAllTime[0]?.value ?? 0,
            cities: cities.size,
            countries: countries.size,
            farthest
        },
        trips: [...new Set(tripRows.map((t) => t.name).filter((n): n is string => !!n))],
        merch: { items: merchRows[0]?.items ?? 0 },
        committees: {
            names: [...new Set(committeeRows.map((c) => c.name))],
            leaderOf: committeeRows.filter((c) => c.isLeader).length
        },
        membership: { memberSince, daysMember },
        totalSpent: Math.round((spentRows[0]?.total ?? 0) * 100) / 100
    };

    return { ...stats, persona: pickPersona(stats) };
}

/**
 * Berekent bij welk top-percentage de gebruiker hoort qua aantal activiteiten.
 * Groepeert alleen op e-mailadres en geeft geen gegevens van anderen terug.
 */
async function getActivityTopPercent(myCount: number, start: string, end: string): Promise<number | null> {
    const perUser = db
        .select({ c: sql<number>`COUNT(*)`.as('c') })
        .from(schema.event_signups)
        .innerJoin(schema.events, eq(schema.events.id, schema.event_signups.event_id))
        .where(and(
            eq(schema.event_signups.payment_status, 'paid'),
            sql`${schema.event_signups.participant_email} IS NOT NULL`,
            gte(schema.events.event_date, start),
            lt(schema.events.event_date, end)
        ))
        .groupBy(sql`LOWER(${schema.event_signups.participant_email})`)
        .as('per_user');

    const result = await db
        .select({
            total: sql<number>`COUNT(*)::int`,
            atLeast: sql<number>`(COUNT(*) FILTER (WHERE ${perUser.c} >= ${myCount}))::int`
        })
        .from(perUser);

    const row = result.at(0);
    if (!row || row.total < MIN_PARTICIPANTS_FOR_PERCENTILE) return null;
    return Math.max(1, Math.ceil((row.atLeast / row.total) * 100));
}

function pickPersona(s: Omit<SamuWrappedStats, 'persona'>): WrappedPersona {
    const a = s.activities.total;

    if (s.committees.leaderOf > 0) {
        return { emoji: '🚀', title: 'De Kartrekker', description: 'Jij zet dingen in beweging. Zonder jou geen Samu zoals we die kennen.' };
    }
    if (s.stickers.total >= 10) {
        return { emoji: '🗺️', title: 'De Stickerkoning', description: 'Waar je ook komt, Salve Mundi is al geweest. Jij markeert de wereld.' };
    }
    if (a >= 15) {
        return { emoji: '🏆', title: 'De Vaste Waarde', description: 'Als er iets te doen is, ben jij er. Elke activiteit voelt als thuiskomen.' };
    }
    if (s.pubCrawls.total >= 2) {
        return { emoji: '🍻', title: 'Het Feestbeest', description: 'Geen kroeg is veilig voor jou. Proost op een legendarisch jaar!' };
    }
    if (s.trips.length > 0) {
        return { emoji: '✈️', title: 'De Wereldreiziger', description: 'Jij pakt je koffer en gaat. De beste herinneringen maak je onderweg.' };
    }
    if (s.committees.names.length >= 2) {
        return { emoji: '🧩', title: 'De Duizendpoot', description: 'Meerdere commissies, één Samu-hart. Waar haal je de tijd vandaan?' };
    }
    if (s.committees.names.length === 1) {
        return { emoji: '💪', title: 'De Actieve Kracht', description: 'Achter de schermen maak jij het verschil voor iedereen.' };
    }
    if (a >= 5) {
        return { emoji: '🎉', title: 'Het Gezelligheidsdier', description: 'Jij weet waar het feest is. En meestal ben jij het feest.' };
    }
    if (a >= 1) {
        return { emoji: '🎯', title: 'De Selectieve Genieter', description: 'Jij kiest je momenten zorgvuldig — en die waren raak.' };
    }
    return { emoji: '🌱', title: 'De Rustige Kracht', description: 'Dit jaar was rustig, maar volgend jaar wordt het jouw jaar. We zien je snel!' };
}
