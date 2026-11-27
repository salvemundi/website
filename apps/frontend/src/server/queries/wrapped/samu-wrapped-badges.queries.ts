import 'server-only';
import { db, schema } from '@salvemundi/db';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
import { type WrappedBadge, type WrappedPersona } from '@/lib/wrapped/samu-wrapped.types';

// ── Drempels ────────────────────────────────────────────────────────
const MIN_FIRST_SIGNUPS = 2; // Snelle Jelle: minstens zo vaak als eerste
const MIN_SIGNUPS_EARLY_BIRD = 3; // Early Bird: pas meetellen vanaf zoveel aanmeldingen
const EARLY_BIRD_AVG_HOURS = 24; // Early Bird: gemiddeld binnen zoveel uur na publicatie aangemeld
const FAST_SIGNUP_MINUTES = 5;
const LAST_MINUTE_MINUTES = 60;
const MIN_LAST_MINUTE = 2;
const MIN_NIGHT_SIGNUPS = 2;
const MIN_MONTH_STREAK = 3;
const MIN_COMMITTEES_HOPPER = 4;
const NEIGHBOURHOOD_KM = 1;
const MIN_NEIGHBOURHOOD_STICKERS = 3;
const FAST_DEPOSIT_MINUTES = 60;
const VETERAN_DAYS = 3 * 365;

/** Wat de hoofdquery al over de gebruiker weet. */
export interface BadgeUserSignup {
    eventDate: string;
    committee: string | null;
    signupHour: number | null;
    minutesAfterPublish: number | null;
    minutesBeforeDeadline: number | null;
}

export interface BadgeUserSticker {
    lat: number | null;
    lng: number | null;
    hour: number | null;
}

export interface BadgeUserTrip {
    willingToDrive: boolean | null;
    extraLuggage: boolean | null;
    minutesToDeposit: number | null;
}

export interface BadgeContext {
    userId: string;
    email: string;
    year: number;
    start: string;
    end: string;
    signups: BadgeUserSignup[];
    stickers: BadgeUserSticker[];
    trips: BadgeUserTrip[];
    memberSince: string | null;
    daysMember: number | null;
    distanceKm: (lat: number, lng: number) => number;
    fallback: WrappedPersona;
}

/**
 * Alle badges op volgorde van zeldzaamheid (zeldzaamste eerst).
 * De eerste verdiende badge komt op de deelkaart.
 */
type BadgeId =
    | 'snelle-jelle' | 'verste-sticker' | 'buurtbaas' | 'pionier' | 'early-bird'
    | 'binnen-5-minuten' | 'stickeren-3-uur' | 'nachtbraker' | 'last-minute' | 'direct-betaald'
    | 'streak' | 'commissie-hopper' | 'chauffeur' | 'veteraan' | 'extra-bagage' | 'groentje';

const RARITY: BadgeId[] = [
    'snelle-jelle', 'verste-sticker', 'buurtbaas', 'pionier',
    'binnen-5-minuten', 'stickeren-3-uur', 'nachtbraker', 'last-minute', 'early-bird', 'direct-betaald',
    'streak', 'commissie-hopper', 'chauffeur', 'veteraan', 'extra-bagage', 'groentje'
];

function times(n: number): string {
    return n === 1 ? 'één keer' : `${n} keer`;
}

function longestMonthStreak(dates: string[]): number {
    const months = [...new Set(dates.map((d) => Number(d.slice(5, 7))))].sort((a, b) => a - b);
    let best = 0;
    let run = 0;
    let prev = -1;
    for (const m of months) {
        run = m === prev + 1 ? run + 1 : 1;
        best = Math.max(best, run);
        prev = m;
    }
    return best;
}

export async function getWrappedBadgesInternal(ctx: BadgeContext): Promise<{ featured: WrappedBadge; others: WrappedBadge[] }> {
    const earned = new Map<BadgeId, WrappedBadge>();
    const add = (id: BadgeId, emoji: string, title: string, description: string) => earned.set(id, { id, emoji, title, description });

    const [signupRanking, stickerRows, pioneer] = await Promise.all([
        ctx.signups.length > 0 ? getSignupRanking(ctx) : null,
        ctx.stickers.length > 0 ? getYearStickerPositions(ctx) : [],
        ctx.stickers.length > 0 ? getPioneerCounts(ctx) : { cities: 0, countries: 0 }
    ]);

    // ── Aanmelden ───────────────────────────────────────────────────
    if (signupRanking && signupRanking.myFirsts >= MIN_FIRST_SIGNUPS && signupRanking.myFirsts === signupRanking.maxFirsts) {
        add('snelle-jelle', '🥇', 'Snelle Jelle',
            `Niemand was zo vaak als eerste aangemeld als jij: ${times(signupRanking.myFirsts)} stond jouw naam bovenaan de lijst.`);
    }

    const delays = ctx.signups
        .map((s) => s.minutesAfterPublish)
        .filter((m): m is number => m !== null && m >= 0);
    if (delays.length >= MIN_SIGNUPS_EARLY_BIRD) {
        const avgHours = delays.reduce((sum, m) => sum + m, 0) / delays.length / 60;
        if (avgHours <= EARLY_BIRD_AVG_HOURS) {
            const shown = avgHours < 1 ? `${Math.max(1, Math.round(avgHours * 60))} minuten` : `${Math.round(avgHours)} uur`;
            add('early-bird', '🐦', 'Early Bird',
                `Gemiddeld meldde je je binnen ${shown} na publicatie aan. De vroege vogel vangt het ticket.`);
        }
    }

    const fast = ctx.signups.filter((s) => s.minutesAfterPublish !== null && s.minutesAfterPublish >= 0 && s.minutesAfterPublish <= FAST_SIGNUP_MINUTES).length;
    if (fast > 0) {
        add('binnen-5-minuten', '⚡', 'Binnen 5 minuten',
            `${fast === 1 ? 'Eén keer' : `${fast} keer`} meldde je je aan binnen ${FAST_SIGNUP_MINUTES} minuten nadat een activiteit online kwam. Notificaties aan, zeker?`);
    }

    const lastMinute = ctx.signups.filter((s) => s.minutesBeforeDeadline !== null && s.minutesBeforeDeadline >= 0 && s.minutesBeforeDeadline <= LAST_MINUTE_MINUTES).length;
    if (lastMinute >= MIN_LAST_MINUTE) {
        add('last-minute', '😅', 'Last Minute Larry', `${times(lastMinute)} meldde je je aan in het laatste uur voor de deadline. Spannend!`);
    }

    const night = ctx.signups.filter((s) => s.signupHour !== null && s.signupHour >= 0 && s.signupHour < 5).length;
    if (night >= MIN_NIGHT_SIGNUPS) {
        add('nachtbraker', '🌙', 'Nachtbraker', `${times(night)} meldde je je aan tussen middernacht en 5 uur 's nachts. Slapen kan altijd nog.`);
    }

    // ── Patronen ────────────────────────────────────────────────────
    const streak = longestMonthStreak(ctx.signups.map((s) => s.eventDate));
    if (streak >= MIN_MONTH_STREAK) {
        add('streak', '🔥', 'On Fire', `${streak} maanden op rij was je bij minstens één activiteit. Die streak breek je niet zomaar.`);
    }

    const committees = new Set(ctx.signups.map((s) => s.committee).filter(Boolean)).size;
    if (committees >= MIN_COMMITTEES_HOPPER) {
        add('commissie-hopper', '🧭', 'Commissie-hopper', `Je ging naar activiteiten van ${committees} verschillende commissies. Jij kent ze allemaal.`);
    }

    // ── Stickers ────────────────────────────────────────────────────
    if (stickerRows.length > 0) {
        let globalMax = 0;
        let myMax = -1;
        const nearCounts = new Map<string, number>();
        for (const s of stickerRows) {
            const km = ctx.distanceKm(s.lat, s.lng);
            globalMax = Math.max(globalMax, km);
            if (s.userId === ctx.userId) myMax = Math.max(myMax, km);
            if (km <= NEIGHBOURHOOD_KM && s.userId) nearCounts.set(s.userId, (nearCounts.get(s.userId) ?? 0) + 1);
        }
        if (myMax >= 0 && myMax === globalMax) {
            add('verste-sticker', '🌍', 'Verste Sticker van Samu',
                `Geen enkele Samu-sticker van ${ctx.year} hangt verder weg dan die van jou: ${Math.round(myMax).toLocaleString('nl-NL')} km van Fontys.`);
        }
        const myNear = nearCounts.get(ctx.userId) ?? 0;
        if (myNear >= MIN_NEIGHBOURHOOD_STICKERS && myNear === Math.max(...nearCounts.values())) {
            add('buurtbaas', '🧲', 'Buurtbaas', `Niemand plakte zoveel stickers rond Fontys als jij: ${myNear} binnen ${NEIGHBOURHOOD_KM} km.`);
        }
    }

    const lateStickers = ctx.stickers.filter((s) => s.hour !== null && s.hour >= 1 && s.hour < 5).length;
    if (lateStickers > 0) {
        add('stickeren-3-uur', '🌃', "Stickeren om 3 uur 's nachts",
            `${lateStickers === 1 ? 'Eén sticker' : `${lateStickers} stickers`} plakte je midden in de nacht. Wat deed je daar eigenlijk?`);
    }

    if (pioneer.cities > 0 || pioneer.countries > 0) {
        const parts = [
            pioneer.countries > 0 ? `${pioneer.countries} ${pioneer.countries === 1 ? 'land' : 'landen'}` : null,
            pioneer.cities > 0 ? `${pioneer.cities} ${pioneer.cities === 1 ? 'stad' : 'steden'}` : null
        ].filter(Boolean).join(' en ');
        add('pionier', '🏁', 'Pionier', `Jij plakte de allereerste Samu-sticker ooit in ${parts}.`);
    }

    // ── Reizen ──────────────────────────────────────────────────────
    if (ctx.trips.some((t) => t.willingToDrive)) {
        add('chauffeur', '🚗', 'Chauffeur', 'Jij bood aan om te rijden. Zonder jou stonden ze nog op de parkeerplaats.');
    }
    if (ctx.trips.some((t) => t.minutesToDeposit !== null && t.minutesToDeposit >= 0 && t.minutesToDeposit <= FAST_DEPOSIT_MINUTES)) {
        add('direct-betaald', '💸', 'Direct Betaald', 'Aangemeld en binnen een uur de aanbetaling gedaan. De penningmeester is fan.');
    }
    if (ctx.trips.some((t) => t.extraLuggage)) {
        add('extra-bagage', '🧳', 'Extra Bagage', 'Licht reizen is niks voor jou: je nam extra bagage mee.');
    }

    // ── Lidmaatschap ────────────────────────────────────────────────
    if (ctx.daysMember !== null && ctx.daysMember >= VETERAN_DAYS) {
        add('veteraan', '🧓', 'Veteraan', `Al ${Math.floor(ctx.daysMember / 365)} jaar lid. Jij hebt Samu zien groeien.`);
    }
    if (ctx.memberSince?.startsWith(String(ctx.year)) && ctx.signups.length > 0) {
        add('groentje', '🐣', 'Groentje', 'Dit jaar lid geworden en meteen van de partij. Wat een start!');
    }

    const ordered = RARITY.map((id) => earned.get(id)).filter((b): b is WrappedBadge => !!b);
    const featured = ordered.at(0);
    return {
        featured: featured ?? { id: 'persona', ...ctx.fallback },
        others: ordered.slice(1)
    };
}

/**
 * Vergelijkt aanmeldgedrag met de rest van de vereniging.
 * Geeft alleen het maximum en de eigen waarde terug — nooit gegevens van anderen.
 */
async function getSignupRanking(ctx: BadgeContext) {
    const s = schema.event_signups;
    const e = schema.events;
    const yearFilter = and(
        eq(s.payment_status, 'paid'),
        sql`${s.participant_email} IS NOT NULL`,
        gte(e.event_date, ctx.start),
        lt(e.event_date, ctx.end)
    );

    // Wie meldde zich per activiteit als eerste aan?
    const firsts = db
        .selectDistinctOn([s.event_id], { em: sql<string>`LOWER(${s.participant_email})`.as('em') })
        .from(s)
        .innerJoin(e, eq(e.id, s.event_id))
        .where(yearFilter)
        .orderBy(s.event_id, asc(s.created_at))
        .as('firsts');

    const firstCounts = db
        .select({ em: firsts.em, c: sql<number>`COUNT(*)`.as('c') })
        .from(firsts)
        .groupBy(firsts.em)
        .as('first_counts');

    const firstRow = await db.select({
        max: sql<number>`COALESCE(MAX(${firstCounts.c}), 0)::int`,
        mine: sql<number>`COALESCE(MAX(${firstCounts.c}) FILTER (WHERE ${firstCounts.em} = ${ctx.email}), 0)::int`
    }).from(firstCounts);

    return {
        maxFirsts: firstRow[0]?.max ?? 0,
        myFirsts: firstRow[0]?.mine ?? 0
    };
}

/** Posities van alle stickers van dit jaar (alleen server-side gebruikt, niet teruggegeven). */
async function getYearStickerPositions(ctx: BadgeContext): Promise<{ userId: string | null; lat: number; lng: number }[]> {
    const rows = await db
        .select({ userId: schema.Stickers.user_created, lat: schema.Stickers.latitude, lng: schema.Stickers.longitude })
        .from(schema.Stickers)
        .where(and(
            gte(schema.Stickers.date_created, ctx.start),
            lt(schema.Stickers.date_created, ctx.end),
            sql`${schema.Stickers.latitude} IS NOT NULL`,
            sql`${schema.Stickers.longitude} IS NOT NULL`
        ));
    return rows.filter((r): r is { userId: string | null; lat: number; lng: number } => r.lat !== null && r.lng !== null);
}

/** In hoeveel steden/landen plakte de gebruiker dit jaar de allereerste Samu-sticker ooit? */
async function getPioneerCounts(ctx: BadgeContext): Promise<{ cities: number; countries: number }> {
    const st = schema.Stickers;
    const countFirsts = async (column: typeof st.city | typeof st.country) => {
        const key = sql`LOWER(TRIM(${column}))`;
        const firsts = db
            .selectDistinctOn([key], { userId: st.user_created, createdAt: st.date_created })
            .from(st)
            .where(and(sql`${column} IS NOT NULL`, sql`TRIM(${column}) <> ''`, sql`${st.date_created} IS NOT NULL`))
            .orderBy(key, asc(st.date_created))
            .as('firsts');
        const rows = await db
            .select({ c: sql<number>`COUNT(*)::int` })
            .from(firsts)
            .where(and(eq(firsts.userId, ctx.userId), gte(firsts.createdAt, ctx.start), lt(firsts.createdAt, ctx.end)));
        return rows[0]?.c ?? 0;
    };
    const [cities, countries] = await Promise.all([countFirsts(st.city), countFirsts(st.country)]);
    return { cities, countries };
}

/** Langste reeks opeenvolgende gepubliceerde activiteiten van het jaar waarvoor de gebruiker zich aanmeldde. */
export async function getLongestSignupRunInternal(myEventIds: Set<number>, start: string, end: string): Promise<{ count: number; events: string[] }> {
    if (myEventIds.size < 3) return { count: 0, events: [] };
    const events = await db
        .select({ id: schema.events.id, name: schema.events.name })
        .from(schema.events)
        .where(and(
            eq(schema.events.status, 'published'),
            gte(schema.events.event_date, start),
            lt(schema.events.event_date, end)
        ))
        .orderBy(asc(schema.events.event_date), asc(schema.events.event_time), asc(schema.events.id));

    let best: string[] = [];
    let run: string[] = [];
    for (const ev of events) {
        run = myEventIds.has(ev.id) ? [...run, ev.name] : [];
        if (run.length > best.length) best = run;
    }
    return { count: best.length, events: best };
}
