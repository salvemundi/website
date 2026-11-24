'use client';

import { Box } from '@mantine/core';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { type SamuWrappedStats } from '@/lib/wrapped/samu-wrapped.types';

export interface WrappedSlide {
    id: string;
    background: string;
    content: ReactNode;
}

// Merkkleuren: donker paars #5A3761, licht paars #936695, geel #F8CF45
const BG = {
    night: 'radial-gradient(120% 90% at 10% 0%, #936695 0%, #5A3761 45%, #201024 100%)',
    sunset: 'linear-gradient(160deg, #F8CF45 0%, #f0855a 45%, #5A3761 100%)',
    berry: 'linear-gradient(200deg, #e05b8a 0%, #936695 50%, #2d1933 100%)',
    ocean: 'linear-gradient(165deg, #3fb5c9 0%, #3a5ba8 50%, #2d1933 100%)',
    lime: 'linear-gradient(170deg, #b8e05b 0%, #3ba57a 50%, #1f2a33 100%)',
    gold: 'radial-gradient(110% 80% at 50% 0%, #F8CF45 0%, #d99a2b 40%, #5A3761 100%)',
    plum: 'linear-gradient(180deg, #46254c 0%, #201024 100%)'
} as const;

const dateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' });
const euroFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function formatWrappedDate(date: string): string {
    return dateFmt.format(new Date(`${date}T12:00:00`));
}

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));

    useEffect(() => {
        if (prefersReducedMotion() || value === 0) {
            setDisplay(value);
            return;
        }
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(value * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);

    return <>{display.toLocaleString('nl-NL')}</>;
}

function delay(ms: number): CSSProperties {
    return { animationDelay: `${ms}ms` };
}

type Anim = 'rise' | 'pop';

function anim(kind: Anim) {
    return kind === 'rise' ? { 'wrapped-rise': true } : { 'wrapped-pop': true };
}

function Kicker({ children, at = 0 }: { children: ReactNode; at?: number }) {
    return <Box component="p" mod={{ 'wrapped-kicker': true, ...anim('rise') }} style={delay(at)}>{children}</Box>;
}

function Huge({ children, at = 150 }: { children: ReactNode; at?: number }) {
    return <Box component="p" mod={{ 'wrapped-huge': true, ...anim('pop') }} style={delay(at)}>{children}</Box>;
}

function Title({ children, at = 150 }: { children: ReactNode; at?: number }) {
    return <Box component="h2" mod={{ 'wrapped-title': true, ...anim('rise') }} style={delay(at)}>{children}</Box>;
}

function Body({ children, at = 400 }: { children: ReactNode; at?: number }) {
    return <Box component="p" mod={{ 'wrapped-body': true, ...anim('rise') }} style={delay(at)}>{children}</Box>;
}

function Emoji({ children, at = 0, size }: { children: ReactNode; at?: number; size?: 'xl' }) {
    return <Box component="p" mod={{ 'wrapped-emoji': size ?? true, ...anim('pop') }} style={delay(at)}>{children}</Box>;
}

function Accent({ children, capitalize }: { children: ReactNode; capitalize?: boolean }) {
    return <Box component="span" mod={{ 'wrapped-accent': capitalize ? 'capitalize' : true }}>{children}</Box>;
}

function Chips({ children }: { children: ReactNode }) {
    return <Box mod={{ 'wrapped-chips': true }}>{children}</Box>;
}

function Chip({ children, at }: { children: ReactNode; at: number }) {
    return <Box component="span" mod={{ 'wrapped-chip': true, ...anim('rise') }} style={delay(at)}>{children}</Box>;
}

/** Namen nooit midden in een woord afbreken; alleen tussen woorden (bijv. tussen voor- en achternaam). */
function Name({ children }: { children: ReactNode }) {
    return <Box component="span" mod={{ 'wrapped-name': true }}>{children}</Box>;
}

function Section({ children }: { children: ReactNode }) {
    return <Box mod={{ 'wrapped-section': true }}>{children}</Box>;
}

function plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
}

/** Zet "commissie" op een eigen regel, zodat lange namen (bijv. "Activiteitencommissie") op het scherm passen. */
function CommitteeName({ name }: { name: string }) {
    const match = /^(.+?)[\s-]?(commissie)$/i.exec(name.trim());
    if (!match) return <>{name}</>;
    return <><Box component="span" mod={{ 'wrapped-line': true }}>{match[1]}</Box><Box component="span" mod={{ 'wrapped-line': true }}>{match[2].toLowerCase()}</Box></>;
}

/** Bouwt de lijst met slides op basis van de stats. Slides zonder data worden overgeslagen. */
export function buildWrappedSlides(s: SamuWrappedStats): WrappedSlide[] {
    const slides: WrappedSlide[] = [];
    const a = s.activities;

    slides.push({
        id: 'intro',
        background: BG.night,
        content: (
            <>
                <Emoji>👋</Emoji>
                <Title at={150}>Hoi <Name>{s.firstName}!</Name></Title>
                <Body at={400}>
                    Tijd om terug te kijken op jouw {s.year} bij Salve Mundi. Klaar voor je Samu Wrapped?
                </Body>
                <Box component="p" mod={{ 'wrapped-hint': true, ...anim('rise') }} style={delay(900)}>
                    Tik om verder te gaan →
                </Box>
            </>
        )
    });

    if (a.total > 0) {
        slides.push({
            id: 'activities',
            background: BG.sunset,
            content: (
                <>
                    <Kicker>Dit jaar was je bij</Kicker>
                    <Huge><CountUp value={a.total} /></Huge>
                    <Title at={600}>{plural(a.total, 'activiteit', 'activiteiten')}</Title>
                    {a.checkedIn > 0 && (
                        <Body at={900}>Bij {a.checkedIn} daarvan werd je ook echt ingecheckt. Bewijs geleverd. ✅</Body>
                    )}
                </>
            )
        });
    } else {
        slides.push({
            id: 'activities-none',
            background: BG.sunset,
            content: (
                <>
                    <Emoji>🛋️</Emoji>
                    <Title>Dit jaar was je nog niet bij een activiteit</Title>
                    <Body>Geen zorgen — de agenda voor volgend jaar staat vol met kansen om dat goed te maken.</Body>
                </>
            )
        });
    }

    if (a.firstEvent) {
        slides.push({
            id: 'first-last',
            background: BG.berry,
            content: (
                <>
                    <Kicker>Het begon allemaal met</Kicker>
                    <Title at={150}>{a.firstEvent.name}</Title>
                    <Body at={350}>op {formatWrappedDate(a.firstEvent.date)}</Body>
                    {a.lastEvent && (
                        <Section>
                            <Kicker at={800}>…en je laatste was</Kicker>
                            <Title at={950}>{a.lastEvent.name}</Title>
                            <Body at={1150}>op {formatWrappedDate(a.lastEvent.date)}</Body>
                        </Section>
                    )}
                </>
            )
        });
    }

    if (a.total >= 2 && a.busiestMonth && a.favoriteWeekday) {
        slides.push({
            id: 'rhythm',
            background: BG.ocean,
            content: (
                <>
                    <Kicker>Jouw Samu-ritme</Kicker>
                    <Title at={150}>
                        Je drukste maand was <Accent capitalize>{a.busiestMonth.name}</Accent>
                    </Title>
                    <Body at={400}>
                        met {a.busiestMonth.count} {plural(a.busiestMonth.count, 'activiteit', 'activiteiten')}.
                    </Body>
                    <Section>
                        <Title at={800}>
                            En op <Accent>{a.favoriteWeekday.name}</Accent> ben je niet te stoppen
                        </Title>
                    </Section>
                    {a.favoriteWeekday.count > 1 && (
                        <Body at={1100}>
                            Op {a.favoriteWeekday.name} was je bij {a.favoriteWeekday.count} verschillende activiteiten.
                        </Body>
                    )}
                </>
            )
        });
    }

    if (a.topCommittee) {
        slides.push({
            id: 'top-committee',
            background: BG.lime,
            content: (
                <>
                    <Kicker>Jouw favoriete commissie</Kicker>
                    <Emoji at={150}>💜</Emoji>
                    <Title at={350}><CommitteeName name={a.topCommittee.name} /></Title>
                    <Body at={650}>
                        Je ging naar {a.topCommittee.count} {plural(a.topCommittee.count, 'activiteit', 'activiteiten')} van
                        hen. Zij weten inmiddels wel wie je bent.
                    </Body>
                </>
            )
        });
    }

    if (a.topPercent !== null && a.topPercent <= 50) {
        slides.push({
            id: 'top-percent',
            background: BG.gold,
            content: (
                <>
                    <Kicker>Je hoort bij de</Kicker>
                    <Huge>top <CountUp value={a.topPercent} />%</Huge>
                    <Title at={600}>actiefste Samu&apos;ers van {s.year}</Title>
                    <Body at={900}>Je was bij meer activiteiten dan het grootste deel van de vereniging. 🔥</Body>
                </>
            )
        });
    }

    if (s.pubCrawls.total > 0) {
        slides.push({
            id: 'pub-crawls',
            background: BG.sunset,
            content: (
                <>
                    <Emoji>🍻</Emoji>
                    <Kicker at={150}>Kroegentocht</Kicker>
                    <Huge at={300}><CountUp value={s.pubCrawls.total} /></Huge>
                    <Title at={650}>{plural(s.pubCrawls.total, 'kroegentocht', 'kroegentochten')} meegelopen</Title>
                    {s.pubCrawls.tickets > s.pubCrawls.total && (
                        <Body at={900}>En je nam in totaal {s.pubCrawls.tickets} tickets mee. Gezellig!</Body>
                    )}
                </>
            )
        });
    }

    if (s.stickers.total > 0) {
        slides.push({
            id: 'stickers',
            background: BG.ocean,
            content: (
                <>
                    <Kicker>Je plakte</Kicker>
                    <Huge><CountUp value={s.stickers.total} /></Huge>
                    <Title at={600}>{plural(s.stickers.total, 'sticker', 'stickers')} op de kaart</Title>
                    <Chips>
                        {s.stickers.cities > 0 && <Chip at={850}>📍 {s.stickers.cities} {plural(s.stickers.cities, 'stad', 'steden')}</Chip>}
                        {s.stickers.countries > 1 && <Chip at={950}>🌍 {s.stickers.countries} landen</Chip>}
                        {s.stickers.allTime > s.stickers.total && <Chip at={1050}>🏷️ {s.stickers.allTime} all-time</Chip>}
                    </Chips>
                    {s.stickers.farthest && s.stickers.farthest.distanceKm >= 25 && (
                        <Body at={1250}>
                            Je verste sticker hangt in {s.stickers.farthest.place}: {s.stickers.farthest.distanceKm.toLocaleString('nl-NL')} km van Fontys.
                        </Body>
                    )}
                </>
            )
        });
    }

    if (s.trips.length > 0) {
        slides.push({
            id: 'trips',
            background: BG.berry,
            content: (
                <>
                    <Emoji>✈️</Emoji>
                    <Kicker at={150}>Op reis</Kicker>
                    <Title at={300}>Je ging mee op {s.trips.length === 1 ? s.trips[0] : `${s.trips.length} reizen`}</Title>
                    {s.trips.length > 1 && (
                        <Chips>
                            {s.trips.map((t, i) => <Chip key={t} at={600 + i * 100}>{t}</Chip>)}
                        </Chips>
                    )}
                    <Body at={900}>Wat op reis gebeurt, blijft op reis. Behalve deze stat.</Body>
                </>
            )
        });
    }

    if (s.committees.names.length > 0) {
        const n = s.committees.names.length;
        slides.push({
            id: 'committees',
            background: BG.lime,
            content: (
                <>
                    <Kicker>Achter de schermen</Kicker>
                    <Title at={150}>Je zat in {n} {plural(n, 'commissie', 'commissies')}</Title>
                    <Chips>
                        {s.committees.names.slice(0, 8).map((c, i) => <Chip key={c} at={400 + i * 90}>{c}</Chip>)}
                    </Chips>
                    <Body at={900}>
                        {s.committees.leaderOf > 0
                            ? `Waarvan ${s.committees.leaderOf === 1 ? 'één' : s.committees.leaderOf} als leider. Respect. 👑`
                            : 'Zonder mensen zoals jij gebeurt er niks. Dankjewel!'}
                    </Body>
                </>
            )
        });
    }

    if (s.merch.items > 0) {
        slides.push({
            id: 'merch',
            background: BG.gold,
            content: (
                <>
                    <Emoji>👕</Emoji>
                    <Kicker at={150}>Merch</Kicker>
                    <Title at={300}>
                        Je scoorde {s.merch.items} {plural(s.merch.items, 'merch-item', 'merch-items')}
                    </Title>
                    <Body at={600}>Je loopt de vereniging letterlijk te promoten. Top!</Body>
                </>
            )
        });
    }

    if (s.membership.daysMember && s.membership.daysMember > 0 && s.membership.memberSince) {
        const years = Math.floor(s.membership.daysMember / 365);
        slides.push({
            id: 'membership',
            background: BG.night,
            content: (
                <>
                    <Kicker>Je bent al</Kicker>
                    <Huge><CountUp value={s.membership.daysMember} duration={1800} /></Huge>
                    <Title at={600}>dagen lid</Title>
                    <Body at={900}>
                        Sinds {formatWrappedDate(s.membership.memberSince)} {s.membership.memberSince.slice(0, 4)}
                        {years >= 1 ? ` — dat is ruim ${years} jaar!` : '. Welkom in de familie!'}
                    </Body>
                </>
            )
        });
    }

    if (s.totalSpent >= 5) {
        slides.push({
            id: 'spent',
            background: BG.berry,
            content: (
                <>
                    <Kicker>Je investeerde</Kicker>
                    <Huge>{euroFmt.format(s.totalSpent)}</Huge>
                    <Title at={600}>in herinneringen</Title>
                    <Body at={900}>Tickets, reizen en merch. Elke euro waard, toch? 😉</Body>
                    <Box component="p" mod={{ 'wrapped-note': true, ...anim('rise') }} style={delay(1100)}>
                        Alleen jij ziet dit — het staat niet op je deelkaart.
                    </Box>
                </>
            )
        });
    }

    slides.push({
        id: 'persona',
        background: BG.plum,
        content: (
            <>
                <Kicker>Jouw Samu-type van {s.year}</Kicker>
                <Emoji at={300} size="xl">{s.persona.emoji}</Emoji>
                <Title at={700}>{s.persona.title}</Title>
                <Body at={1000}>{s.persona.description}</Body>
            </>
        )
    });

    return slides;
}

/**
 * Houdt tekst op één regel en verkleint de letter als hij niet past.
 * Gebruikt container-query-eenheden (cqi) t.o.v. de breedte van de kaart.
 */
function oneLineFit(text: string, maxRem: number): CSSProperties {
    // ~0.62em per teken voor Poppins Black
    const ems = Math.max(1, text.length * 0.62);
    return { fontSize: `min(${maxRem}rem, calc(100cqi / ${ems.toFixed(2)}))`, whiteSpace: 'nowrap' };
}

interface ShareRow {
    label: string;
    value: ReactNode;
    /** Tekstwaarde: label boven de waarde, waarde op één regel over de volle breedte */
    text?: string;
}

/** De kaart die als afbeelding gedeeld kan worden. Bevat bewust geen financiële gegevens. */
export function WrappedShareCard({ stats: s }: { stats: SamuWrappedStats }) {
    const rows: ShareRow[] = [
        { label: 'Activiteiten', value: s.activities.total }
    ];
    if (s.activities.topCommittee) {
        const name = s.activities.topCommittee.name;
        rows.push({ label: 'Favoriete commissie', value: name, text: name });
    }
    if (s.pubCrawls.total > 0) rows.push({ label: 'Kroegentochten', value: s.pubCrawls.total });
    if (s.stickers.total > 0) rows.push({ label: 'Stickers geplakt', value: s.stickers.total });
    if (s.trips.length > 0) rows.push({ label: 'Reizen', value: s.trips.length });
    if (s.committees.names.length > 0) rows.push({ label: 'Commissies', value: s.committees.names.length });
    if (s.activities.topPercent !== null && s.activities.topPercent <= 50) rows.push({ label: 'Ranking', value: `top ${s.activities.topPercent}%` });

    return (
        <Box mod={{ 'wrapped-card': true }}>
            <Box mod={{ 'wrapped-card-glow': true }} />
            <Box mod={{ 'wrapped-card-inner': true }}>
                <Box component="p" mod={{ 'wrapped-card-kicker': true }}>Samu Wrapped {s.year}</Box>
                <Box component="p" mod={{ 'wrapped-card-name': true }} style={oneLineFit(s.firstName, 1.5)}>
                    <Name>{s.firstName}</Name>
                </Box>
                <Box mod={{ 'wrapped-card-persona': true }}>
                    <Box component="span" mod={{ 'wrapped-card-emoji': true }}>{s.persona.emoji}</Box>
                    <Box component="span" mod={{ 'wrapped-card-persona-title': true }}>{s.persona.title}</Box>
                </Box>
                <Box mod={{ 'wrapped-rows': true }}>
                    {rows.slice(0, 6).map((r) => (
                        <Box key={r.label} mod={{ 'wrapped-row': r.text ? 'stacked' : true }}>
                            <Box component="span" mod={{ 'wrapped-row-label': true }}>{r.label}</Box>
                            <Box
                                component="span"
                                mod={{ 'wrapped-row-value': true }}
                                style={r.text ? oneLineFit(r.text, 1.25) : undefined}
                            >
                                {r.value}
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Box component="p" mod={{ 'wrapped-card-foot': true }}>salvemundi.nl</Box>
            </Box>
        </Box>
    );
}
