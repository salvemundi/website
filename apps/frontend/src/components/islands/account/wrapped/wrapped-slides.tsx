'use client';

import { Box, Image } from '@mantine/core';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { type SamuWrappedStats } from '@/lib/wrapped/samu-wrapped.types';

/**
 * Slide-thema's volgens de Brandguide Salve Mundi:
 * - brand:  donker paars vlak, titels geel, tekst wit paars (titel-/hoofdstukpagina's)
 * - dark:   donker blauw vlak, titels geel, tekst wit paars
 * - light:  wit paars vlak, tekst donker blauw, nadruk donker paars (inhoudspagina's)
 * - yellow: geel vlak, tekst donker blauw (spaarzaam, voor één hoogtepunt)
 */
export type WrappedTheme = 'brand' | 'dark' | 'light' | 'yellow';

export interface WrappedSlide {
    id: string;
    /** Sectienaam in de voettekst, zoals in de brandguide ("1.0 Activiteiten") */
    section: string;
    theme: WrappedTheme;
    content: ReactNode;
}

export const BEELDMERK: Record<WrappedTheme, string> = {
    brand: '/img/wrapped/beeldmerk-geel.png',
    dark: '/img/wrapped/beeldmerk-geel.png',
    light: '/img/wrapped/beeldmerk-paars.png',
    yellow: '/img/wrapped/beeldmerk-paars.png'
};

const dateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' });
const euroFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function formatWrappedDate(date: string): string {
    return dateFmt.format(new Date(`${date}T12:00:00`));
}

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
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

const rise = { 'wrapped-rise': true };

/** Kleine kop boven een slide, ExtraBold Italic in hoofdletters (toc-entry). */
function Kicker({ children, at = 0 }: { children: ReactNode; at?: number }) {
    return <Box component="p" mod={{ 'wrapped-kicker': true, ...rise }} style={delay(at)}>{children}</Box>;
}

/** Groot cijfer, Poppins Black (chapter-number). */
function Huge({ children, at = 100 }: { children: ReactNode; at?: number }) {
    return <Box component="p" mod={{ 'wrapped-huge': true, ...rise }} style={delay(at)}>{children}</Box>;
}

/** Kop in Poppins Black, hoofdletters (chapter-title). */
function Title({ children, at = 150 }: { children: ReactNode; at?: number }) {
    return <Box component="h2" mod={{ 'wrapped-title': true, ...rise }} style={delay(at)}>{children}</Box>;
}

/** Lopende tekst in Poppins Light (body). */
function Body({ children, at = 300 }: { children: ReactNode; at?: number }) {
    return <Box component="p" mod={{ 'wrapped-body': true, ...rise }} style={delay(at)}>{children}</Box>;
}

/** Nadruk binnen lopende tekst (body-strong in de accentkleur). */
function Strong({ children }: { children: ReactNode }) {
    return <Box component="span" mod={{ 'wrapped-strong': true }}>{children}</Box>;
}

/** Definitielijst zoals de kernwaarden-pagina: label in Black Italic, waarde rechts. */
function DefList({ items, at = 400 }: { items: { label: string; value: ReactNode }[]; at?: number }) {
    return (
        <Box mod={{ 'wrapped-deflist': true, ...rise }} style={delay(at)}>
            {items.map((item) => (
                <Box key={item.label} mod={{ 'wrapped-defrow': true }}>
                    <Box component="span" mod={{ 'wrapped-deflabel': true }}>{item.label}</Box>
                    <Box component="span" mod={{ 'wrapped-defvalue': true }}>{item.value}</Box>
                </Box>
            ))}
        </Box>
    );
}

/** Lijst van namen onder elkaar (label-stijl). */
function NameList({ names, at = 400 }: { names: string[]; at?: number }) {
    return (
        <Box mod={{ 'wrapped-namelist': true, ...rise }} style={delay(at)}>
            {names.map((n) => <Box key={n} component="span" mod={{ 'wrapped-deflabel': true }}>{n}</Box>)}
        </Box>
    );
}

function Spacer() {
    return <Box mod={{ 'wrapped-spacer': true }} />;
}

/** Namen nooit midden in een woord afbreken; alleen tussen woorden. */
function Name({ children }: { children: ReactNode }) {
    return <Box component="span" mod={{ 'wrapped-name': true }}>{children}</Box>;
}

/** Zet "commissie" op een eigen regel, zodat lange namen (bijv. "Activiteitencommissie") passen. */
function CommitteeName({ name }: { name: string }) {
    const match = /^(.+?)[\s-]?(commissie)$/i.exec(name.trim());
    if (!match) return <>{name}</>;
    return (
        <>
            <Box component="span" mod={{ 'wrapped-line': true }}>{match[1]}</Box>
            <Box component="span" mod={{ 'wrapped-line': true }}>{match[2].toLowerCase()}</Box>
        </>
    );
}

function plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
}

/** Bouwt de lijst met slides op basis van de stats. Slides zonder data worden overgeslagen. */
export function buildWrappedSlides(s: SamuWrappedStats): WrappedSlide[] {
    const slides: WrappedSlide[] = [];
    const a = s.activities;

    slides.push({
        id: 'intro',
        section: 'Samu Wrapped',
        theme: 'brand',
        content: (
            <>
                <Box mod={{ 'wrapped-cover-logo': true, ...rise }}>
                    <Image src="/img/Logo_Light.svg" alt="Salve Mundi" fit="contain" h="100%" w="auto" />
                </Box>
                <Box component="h1" mod={{ 'wrapped-cover-title': true, ...rise }} style={delay(150)}>Samu Wrapped</Box>
                <Box component="p" mod={{ 'wrapped-subtitle': true, ...rise }} style={delay(250)}>{s.year}</Box>
                <Body at={450}>
                    Hoi <Name>{s.firstName}</Name>. Dit was jouw jaar bij Salve Mundi, in cijfers.
                </Body>
                <Box component="p" mod={{ 'wrapped-hint': true, ...rise }} style={delay(800)}>
                    Tik om verder te gaan
                </Box>
            </>
        )
    });

    if (a.total > 0) {
        slides.push({
            id: 'activities',
            section: 'Activiteiten',
            theme: 'dark',
            content: (
                <>
                    <Kicker>Dit jaar was je bij</Kicker>
                    <Huge><CountUp value={a.total} /></Huge>
                    <Title at={400}>{plural(a.total, 'activiteit', 'activiteiten')}</Title>
                    {a.checkedIn > 0 && (
                        <Body at={600}>Bij <Strong>{a.checkedIn}</Strong> daarvan ben je ook echt ingecheckt.</Body>
                    )}
                </>
            )
        });
    } else {
        slides.push({
            id: 'activities-none',
            section: 'Activiteiten',
            theme: 'dark',
            content: (
                <>
                    <Kicker>Activiteiten</Kicker>
                    <Title>Nog geen activiteit dit jaar</Title>
                    <Body>Volgend jaar staat er weer genoeg op de agenda. We zien je graag een keer.</Body>
                </>
            )
        });
    }

    if (a.firstEvent) {
        slides.push({
            id: 'first-last',
            section: 'Eerste en laatste',
            theme: 'light',
            content: (
                <>
                    <Kicker>Je eerste activiteit</Kicker>
                    <Title at={100}>{a.firstEvent.name}</Title>
                    <Body at={250}>{formatWrappedDate(a.firstEvent.date)}</Body>
                    {a.lastEvent && (
                        <>
                            <Spacer />
                            <Kicker at={500}>Je laatste activiteit</Kicker>
                            <Title at={600}>{a.lastEvent.name}</Title>
                            <Body at={750}>{formatWrappedDate(a.lastEvent.date)}</Body>
                        </>
                    )}
                </>
            )
        });
    }

    if (a.total >= 2 && a.busiestMonth && a.favoriteWeekday) {
        slides.push({
            id: 'rhythm',
            section: 'Ritme',
            theme: 'brand',
            content: (
                <>
                    <Kicker>Drukste maand</Kicker>
                    <Title at={100}>{a.busiestMonth.name}</Title>
                    <Body at={250}>
                        <Strong>{a.busiestMonth.count}</Strong> {plural(a.busiestMonth.count, 'activiteit', 'activiteiten')} in {a.busiestMonth.name}.
                    </Body>
                    <Spacer />
                    <Kicker at={500}>Favoriete dag</Kicker>
                    <Title at={600}>{a.favoriteWeekday.name}</Title>
                    {a.favoriteWeekday.count > 1 && (
                        <Body at={750}>
                            Op {a.favoriteWeekday.name} was je bij <Strong>{a.favoriteWeekday.count}</Strong> verschillende activiteiten.
                        </Body>
                    )}
                </>
            )
        });
    }

    if (a.topCommittee) {
        slides.push({
            id: 'top-committee',
            section: 'Favoriete commissie',
            theme: 'light',
            content: (
                <>
                    <Kicker>Je favoriete commissie</Kicker>
                    <Title at={100}><CommitteeName name={a.topCommittee.name} /></Title>
                    <Body at={300}>
                        Je ging naar <Strong>{a.topCommittee.count}</Strong> {plural(a.topCommittee.count, 'activiteit', 'activiteiten')} van deze commissie.
                    </Body>
                </>
            )
        });
    }

    if (s.topPercent !== null && s.topPercent <= 50) {
        slides.push({
            id: 'top-percent',
            section: 'Ranking',
            theme: 'yellow',
            content: (
                <>
                    <Kicker>Je hoort bij de</Kicker>
                    <Huge>top <CountUp value={s.topPercent} />%</Huge>
                    <Title at={400}>actiefste leden van {s.year}</Title>
                    <Body at={600}>Gemeten over al je stats: activiteiten, kroegentochten, reizen, stickers, webshop en commissies.</Body>
                </>
            )
        });
    }

    if (s.pubCrawls.total > 0) {
        slides.push({
            id: 'pub-crawls',
            section: 'Kroegentocht',
            theme: 'dark',
            content: (
                <>
                    <Kicker>Kroegentocht</Kicker>
                    <Huge><CountUp value={s.pubCrawls.total} /></Huge>
                    <Title at={400}>{plural(s.pubCrawls.total, 'kroegentocht', 'kroegentochten')} gelopen</Title>
                    {s.pubCrawls.tickets > s.pubCrawls.total && (
                        <Body at={600}>Met in totaal <Strong>{s.pubCrawls.tickets}</Strong> tickets. Gezellig.</Body>
                    )}
                </>
            )
        });
    }

    if (s.stickers.total > 0) {
        const items: { label: string; value: ReactNode }[] = [];
        if (s.stickers.cities > 0) items.push({ label: plural(s.stickers.cities, 'Stad', 'Steden'), value: s.stickers.cities });
        if (s.stickers.countries > 1) items.push({ label: 'Landen', value: s.stickers.countries });
        if (s.stickers.allTime > s.stickers.total) items.push({ label: 'Totaal ooit', value: s.stickers.allTime });
        slides.push({
            id: 'stickers',
            section: 'Stickers',
            theme: 'brand',
            content: (
                <>
                    <Kicker>Je plakte</Kicker>
                    <Huge><CountUp value={s.stickers.total} /></Huge>
                    <Title at={400}>{plural(s.stickers.total, 'sticker', 'stickers')}</Title>
                    {items.length > 0 && <DefList items={items} at={550} />}
                    {s.stickers.farthest && s.stickers.farthest.distanceKm >= 25 && (
                        <Body at={700}>
                            Je verste sticker hangt in <Strong>{s.stickers.farthest.place}</Strong>, {s.stickers.farthest.distanceKm.toLocaleString('nl-NL')} km van Fontys.
                        </Body>
                    )}
                </>
            )
        });
    }

    if (s.trips.length > 0) {
        slides.push({
            id: 'trips',
            section: 'Reizen',
            theme: 'light',
            content: (
                <>
                    <Kicker>Op reis</Kicker>
                    <Title at={100}>{s.trips.length === 1 ? s.trips[0] : `${s.trips.length} reizen`}</Title>
                    {s.trips.length > 1 && <NameList names={s.trips} at={300} />}
                    <Body at={500}>Wat op reis gebeurt, blijft op reis. Behalve deze stat.</Body>
                </>
            )
        });
    }

    if (s.committees.names.length > 0) {
        const n = s.committees.names.length;
        slides.push({
            id: 'committees',
            section: 'Commissies',
            theme: 'dark',
            content: (
                <>
                    <Kicker>Actief in</Kicker>
                    <Title at={100}>{n} {plural(n, 'commissie', 'commissies')}</Title>
                    <NameList names={s.committees.names.slice(0, 8)} at={300} />
                    <Body at={500}>
                        {s.committees.leaderOf > 0
                            ? <>Bij <Strong>{s.committees.leaderOf === 1 ? 'één' : s.committees.leaderOf}</Strong> daarvan ben je leider.</>
                            : 'Dankjewel voor je inzet.'}
                    </Body>
                </>
            )
        });
    }

    if (s.merch.items > 0) {
        slides.push({
            id: 'merch',
            section: 'Merch',
            theme: 'light',
            content: (
                <>
                    <Kicker>Merch</Kicker>
                    <Huge><CountUp value={s.merch.items} /></Huge>
                    <Title at={400}>{plural(s.merch.items, 'item', 'items')} besteld</Title>
                    <Body at={600}>Je draagt de vereniging letterlijk uit.</Body>
                </>
            )
        });
    }

    if (s.membership.daysMember && s.membership.daysMember > 0 && s.membership.memberSince) {
        const years = Math.floor(s.membership.daysMember / 365);
        slides.push({
            id: 'membership',
            section: 'Lidmaatschap',
            theme: 'brand',
            content: (
                <>
                    <Kicker>Je bent al</Kicker>
                    <Huge><CountUp value={s.membership.daysMember} duration={1600} /></Huge>
                    <Title at={400}>dagen lid</Title>
                    <Body at={600}>
                        {s.membership.hadBreak ? 'Voor het eerst lid' : 'Lid sinds'} {formatWrappedDate(s.membership.memberSince)} {s.membership.memberSince.slice(0, 4)}
                        {years >= 1 ? <>, in totaal ruim <Strong>{years} jaar</Strong>.</> : '. Welkom bij de vereniging.'}
                    </Body>
                    {s.membership.hadBreak && (
                        <Box component="p" mod={{ 'wrapped-note': true, ...rise }} style={delay(800)}>
                            Periodes waarin je geen lid was, tellen niet mee.
                        </Box>
                    )}
                </>
            )
        });
    }

    if (s.totalSpent >= 5) {
        slides.push({
            id: 'spent',
            section: 'Uitgaven',
            theme: 'dark',
            content: (
                <>
                    <Kicker>Uitgegeven bij Salve Mundi</Kicker>
                    <Huge>{euroFmt.format(s.totalSpent)}</Huge>
                    <Body at={400}>Aan tickets, reizen en merch.</Body>
                    <Box component="p" mod={{ 'wrapped-note': true, ...rise }} style={delay(600)}>
                        Alleen jij ziet dit. Het staat niet op je deelkaart.
                    </Box>
                </>
            )
        });
    }

    slides.push({
        id: 'persona',
        section: 'Samu-type',
        theme: 'brand',
        content: (
            <>
                <Box mod={{ 'wrapped-mark': true, ...rise }}>
                    <Image src={BEELDMERK.brand} alt="" fit="contain" h="100%" w="auto" />
                </Box>
                <Kicker at={200}>Jouw Samu-type van {s.year}</Kicker>
                <Title at={350}>{s.persona.title}</Title>
                <Body at={550}>{s.persona.description}</Body>
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

/**
 * De kaart die als afbeelding gedeeld kan worden, opgemaakt als een pagina uit de brandguide
 * (beeldmerk + SALVE MUNDI, donker paars vlak, geel kop). Bevat bewust geen financiële gegevens.
 */
export function WrappedShareCard({ stats: s }: { stats: SamuWrappedStats }) {
    const rows: ShareRow[] = [
        { label: 'Activiteiten', value: s.activities.total }
    ];
    if (s.activities.topCommittee) {
        const name = s.activities.topCommittee.name;
        rows.push({ label: 'Favoriete commissie', value: name, text: name });
    }
    if (s.merch.items > 0) rows.push({ label: 'Webshop-items', value: s.merch.items });
    if (s.stickers.total > 0) rows.push({ label: 'Stickers', value: s.stickers.total });
    if (s.trips.length > 0) rows.push({ label: 'Reizen', value: s.trips.length });
    if (s.committees.names.length > 0) rows.push({ label: 'Commissies', value: s.committees.names.length });
    if (s.topPercent !== null && s.topPercent <= 50) rows.push({ label: 'Ranking', value: `top ${s.topPercent}%` });

    return (
        <Box mod={{ 'wrapped-card': true }}>
            <Box mod={{ 'wrapped-card-head': true }}>
                <Box mod={{ 'wrapped-card-mark': true }}>
                    <Image src={BEELDMERK.brand} alt="" fit="contain" h="100%" w="auto" />
                </Box>
                <Box component="span" mod={{ 'wrapped-card-brand': true }}>Salve Mundi</Box>
            </Box>
            <Box component="p" mod={{ 'wrapped-card-title': true }}>Wrapped {s.year}</Box>
            <Box component="p" mod={{ 'wrapped-card-name': true }} style={oneLineFit(s.firstName, 1.5)}>
                <Name>{s.firstName}</Name>
            </Box>
            <Box component="p" mod={{ 'wrapped-card-persona': true }}>{s.persona.title}</Box>
            <Box mod={{ 'wrapped-rows': true }}>
                {rows.slice(0, 5).map((r) => (
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
            <Box mod={{ 'wrapped-card-foot': true }}>
                <Box component="span">salvemundi.nl</Box>
                <Box component="span">Spreid je vleugels</Box>
            </Box>
        </Box>
    );
}
