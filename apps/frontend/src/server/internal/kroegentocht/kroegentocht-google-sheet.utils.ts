import 'server-only';
import { createSign } from 'node:crypto';
import { logInfo, logWarn, safeConsoleError } from '@/server/utils/logger';
import { fetchPubCrawlSignupsDb } from './kroegentocht-signup-db.utils';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { getAssociationStats, getParticipantNames } from '@/lib/utils/kroegentocht-signups';

/**
 * Synchroniseert de kroegentocht-aanmeldingen naar een Google Sheet.
 *
 * Het sheet-ID wordt per kroegentocht ingesteld (pub_crawl_events.google_sheet_id).
 * Benodigde env-variabelen (één service account voor alle kroegentochten):
 *  - GOOGLE_SERVICE_ACCOUNT_EMAIL        e-mail van het service account
 *  - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  private key (PEM, "\n" mag escaped zijn)
 * De sheet moet gedeeld zijn met het service-account-adres (rol: Bewerker).
 */

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TAB_GROUPS = 'Groepsindeling';
/** Bestond vroeger; wordt alleen nog opgeruimd. */
const TAB_SIGNUPS = 'Aanmeldingen';
const TAB_ASSOCIATIONS = 'Verenigingen';

interface ServiceAccount {
    email: string;
    privateKey: string;
}

interface SheetConfig extends ServiceAccount {
    sheetId: string;
}

function getServiceAccount(): ServiceAccount | null {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
    if (!email || !privateKey) return null;
    return { email, privateKey };
}

async function getEventSheetId(eventId: number): Promise<string | null> {
    const row = (await db
        .select({ sheetId: schema.pub_crawl_events.google_sheet_id })
        .from(schema.pub_crawl_events)
        .where(eq(schema.pub_crawl_events.id, eventId))
        .limit(1)).at(0);
    return row?.sheetId?.trim() || null;
}

export function getSheetUrl(sheetId: string | null): string | null {
    return sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;
}

export async function getKroegSheetUrl(eventId: number): Promise<string | null> {
    return getSheetUrl(await getEventSheetId(eventId));
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: SheetConfig): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

    const now = Math.floor(Date.now() / 1000);
    const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
        iss: cfg.email,
        scope: SHEETS_SCOPE,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    })}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(cfg.privateKey).toString('base64url');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        signal: AbortSignal.timeout(20_000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${unsigned}.${signature}`
        })
    });
    if (!res.ok) throw new Error(`Google token request failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return json.access_token;
}

async function sheetsFetch(cfg: SheetConfig, path: string, init: RequestInit = {}): Promise<unknown> {
    const token = await getAccessToken(cfg);
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cfg.sheetId}${path}`, {
        ...init,
        signal: AbortSignal.timeout(30_000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
    });
    if (!res.ok) throw new Error(`Google Sheets ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

interface SheetProps { sheetId: number; title: string; index: number }

async function getTabs(cfg: SheetConfig): Promise<SheetProps[]> {
    const meta = (await sheetsFetch(cfg, '?fields=sheets.properties(sheetId,title,index)')) as { sheets?: { properties: SheetProps }[] };
    return (meta.sheets ?? []).map((s) => s.properties).sort((x, y) => x.index - y.index);
}

/**
 * Zorgt dat de extra tabbladen bestaan en geeft het eerste (standaard) tabblad terug,
 * waarop de groepsindeling komt. Een oud los 'Groepsindeling'-tabblad wordt opgeruimd.
 */
async function prepareTabs(cfg: SheetConfig, extraTitles: string[]): Promise<SheetProps> {
    let tabs = await getTabs(cfg);
    const first = tabs.at(0);
    if (!first) throw new Error('Google Sheet heeft geen tabbladen');
    const requests: object[] = [];
    // Opruimen: oud los 'Groepsindeling'-tabblad en het 'Aanmeldingen'-tabblad
    // (bevat namen + e-mails, hoort niet in een gedeelde sheet).
    for (const t of tabs) {
        if (t.sheetId !== first.sheetId && (t.title === TAB_GROUPS || t.title === TAB_SIGNUPS)) {
            requests.push({ deleteSheet: { sheetId: t.sheetId } });
        }
    }
    for (const title of extraTitles) {
        if (!tabs.some((t) => t.title === title)) requests.push({ addSheet: { properties: { title } } });
    }
    if (requests.length > 0) {
        await sheetsFetch(cfg, ':batchUpdate', { method: 'POST', body: JSON.stringify({ requests }) });
        tabs = await getTabs(cfg);
    }
    return tabs.at(0) ?? first;
}

type Cell = string | number;

interface GroupConfig {
    name: string;
    leaders: { name: string; signupId?: number | null }[];
}

function parseGroups(raw: unknown): GroupConfig[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((g: unknown): GroupConfig => {
            if (typeof g === 'string') return { name: g, leaders: [] };
            const obj = (g && typeof g === 'object' ? g : {}) as { name?: unknown; leaders?: unknown };
            return {
                name: typeof obj.name === 'string' ? obj.name : '',
                leaders: Array.isArray(obj.leaders) ? (obj.leaders as GroupConfig['leaders']) : []
            };
        })
        .filter((g) => g.name !== '');
}

async function buildSheetData(eventId: number) {
    const eventRow = (await db.select().from(schema.pub_crawl_events).where(eq(schema.pub_crawl_events.id, eventId)).limit(1)).at(0);
    const groups = parseGroups(eventRow?.groups);
    const signups = (await fetchPubCrawlSignupsDb(eventId)).filter((s) => s.payment_status === 'paid');
    const eventName = eventRow?.name ?? `Event ${eventId}`;
    const syncedAt = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

    // --- Tab 1: groepsindeling (één kolom per groep, leiders bovenaan) ---
    const columns = [...groups.map((g) => g.name), 'Niet ingedeeld'];
    const perGroup = new Map<string, string[]>(columns.map((c) => [c, []]));
    for (const s of signups) {
        const group = s.group_name && perGroup.has(s.group_name) ? s.group_name : 'Niet ingedeeld';
        const leaders = groups.find((g) => g.name === group)?.leaders ?? [];
        const names = getParticipantNames(s).filter((n) => !leaders.some(
            (l) => l.signupId === Number(s.id) && l.name.trim().toLowerCase() === n.trim().toLowerCase()
        ));
        perGroup.get(group)?.push(...names);
    }
    const maxLeaders = Math.max(0, ...groups.map((g) => g.leaders.length));
    const maxRows = Math.max(0, ...columns.map((c) => perGroup.get(c)?.length ?? 0));
    const groupRows: Cell[][] = [
        [`${eventName} — laatst gesynchroniseerd ${syncedAt}`],
        columns.map((c, i) => (c === 'Niet ingedeeld' ? c : `${i + 1} - ${c}`)),
        columns.map((c) => {
            // Zelfde telling als op de site: deelnemers incl. leiders die zelf hebben ingeschreven.
            const n = (perGroup.get(c)?.length ?? 0) + (groups.find((g) => g.name === c)?.leaders.filter((l) => l.signupId).length ?? 0);
            return `${n} ${n === 1 ? 'deelnemer' : 'deelnemers'}`;
        })
    ];
    // Leiders-cellen (rij, kolom; 0-based) om ze in de sheet te markeren.
    const leaderCells: [number, number][] = [];
    for (let i = 0; i < maxLeaders; i++) {
        const rowIndex = groupRows.length;
        groupRows.push(columns.map((c, colIndex) => {
            const leader = groups.find((g) => g.name === c)?.leaders.at(i);
            if (!leader) return '';
            leaderCells.push([rowIndex, colIndex]);
            return leader.signupId ? leader.name : `${leader.name} (extern)`;
        }));
    }
    if (maxLeaders > 0) groupRows.push([]);
    for (let i = 0; i < maxRows; i++) {
        groupRows.push(columns.map((c) => perGroup.get(c)?.at(i) ?? ''));
    }

    // --- Tab 3: verenigingen ---
    const stats = getAssociationStats(signups);
    const associationRows: Cell[][] = [
        ['Vereniging', 'Personen', 'Inschrijvingen'],
        ...stats.map((s) => [s.association, s.participants, s.signups]),
        [],
        ['Totaal', stats.reduce((n, s) => n + s.participants, 0), stats.reduce((n, s) => n + s.signups, 0)]
    ];

    return { groupRows, associationRows, leaderCells, columnCount: columns.length };
}

/**
 * Groepsindeling als tabel voor de CSV-export (zelfde opzet als het eerste tabblad van de
 * sheet). CSV kent geen kleuren, dus groepsleiders krijgen '(groepsleider)' achter hun naam.
 */
export async function getKroegGroupRowsForCsv(eventId: number): Promise<Cell[][]> {
    const { groupRows, leaderCells } = await buildSheetData(eventId);
    const isLeader = new Set(leaderCells.map(([r, c]) => `${r}:${c}`));
    return groupRows.map((row, r) => row.map((value, c) => {
        if (typeof value !== 'string') return value;
        if (r === 0 && c === 0) return value.replace('laatst gesynchroniseerd', 'geëxporteerd op');
        return isLeader.has(`${r}:${c}`) && value ? `${value} (groepsleider)` : value;
    }));
}

/** Schrijft de volledige stand van een event naar de Google Sheet (groepsindeling op het eerste tabblad + verenigingen). */
export async function syncKroegSheetNow(eventId: number): Promise<{ synced: boolean; reason?: string }> {
    const account = getServiceAccount();
    if (!account) return { synced: false, reason: 'Google service account is niet geconfigureerd op de server' };
    const sheetId = await getEventSheetId(eventId);
    if (!sheetId) return { synced: false, reason: 'Geen Google Sheet ingesteld voor deze kroegentocht' };
    const cfg: SheetConfig = { ...account, sheetId };

    const { groupRows, associationRows, leaderCells, columnCount } = await buildSheetData(eventId);
    const mainTab = await prepareTabs(cfg, [TAB_ASSOCIATIONS]);

    const tabs: [string, Cell[][]][] = [[mainTab.title, groupRows], [TAB_ASSOCIATIONS, associationRows]];
    await sheetsFetch(cfg, '/values:batchClear', {
        method: 'POST',
        body: JSON.stringify({ ranges: tabs.map(([t]) => `'${t.replace(/'/g, "''")}'`) })
    });
    await sheetsFetch(cfg, '/values:batchUpdate', {
        method: 'POST',
        body: JSON.stringify({
            valueInputOption: 'RAW',
            data: tabs.map(([t, values]) => ({ range: `'${t.replace(/'/g, "''")}'!A1`, values }))
        })
    });

    // Opmaak groepsindeling: oude opmaak wissen, kopregel vet, groepsleiders gemarkeerd.
    const tabId = mainTab.sheetId;
    const fields = 'userEnteredFormat(backgroundColor,textFormat)';
    const leaderFormat = { backgroundColor: { red: 1, green: 0.85, blue: 0.4 }, textFormat: { bold: true } };
    const requests: object[] = [
        { repeatCell: { range: { sheetId: tabId }, cell: { userEnteredFormat: {} }, fields } },
        { repeatCell: { range: { sheetId: tabId, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: columnCount }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields } },
        ...leaderCells.map(([row, col]) => ({
            repeatCell: {
                range: { sheetId: tabId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: col, endColumnIndex: col + 1 },
                cell: { userEnteredFormat: leaderFormat },
                fields
            }
        }))
    ];
    await sheetsFetch(cfg, ':batchUpdate', { method: 'POST', body: JSON.stringify({ requests }) });

    return { synced: true };
}

// Eén geplande sync per event. Op globalThis zodat alle server-bundels (en dev-hot-reloads)
// dezelfde planning delen.
const globalForSync = globalThis as unknown as { kroegSheetPending?: Map<number, ReturnType<typeof setTimeout>> };
const pending = (globalForSync.kroegSheetPending ??= new Map<number, ReturnType<typeof setTimeout>>());

function getSyncDelayMs(): number {
    const fromEnv = Number(process.env.KROEGENTOCHT_SHEET_SYNC_DELAY_MS);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 5 * 60 * 1000;
}

const RETRY_DELAY_MS = 60 * 1000;
const MAX_RETRIES = 5;

/**
 * Plant een sync in de achtergrond, uiterlijk 5 minuten na de eerste wijziging die nog
 * niet in de sheet staat. Latere wijzigingen schuiven de sync niet op; ze gaan mee in
 * dezelfde sync (die altijd de actuele stand uit de database leest). Faalt nooit naar
 * de aanroeper toe.
 */
export function scheduleKroegSheetSync(eventId: number): void {
    if (!getServiceAccount() || !Number.isFinite(eventId)) return;
    if (pending.has(eventId)) return;
    planSync(eventId, getSyncDelayMs(), 0);
}

function planSync(eventId: number, delayMs: number, attempt: number): void {
    pending.set(eventId, setTimeout(() => {
        void (async () => {
            try {
                const res = await syncKroegSheetNow(eventId);
                pending.delete(eventId);
                if (res.synced) logInfo(`[kroegentocht-sheet] Automatische sync event ${eventId} voltooid`);
                else safeConsoleError('[kroegentocht-google-sheet.utils.ts][scheduleKroegSheetSync]', res.reason);
            } catch (error: unknown) {
                // Meestal een tijdelijk netwerkprobleem richting Google: na een minuut opnieuw.
                if (attempt < MAX_RETRIES) {
                    logWarn(`[kroegentocht-sheet] Sync event ${eventId} mislukt (poging ${attempt + 1}), opnieuw over 1 minuut`);
                    planSync(eventId, RETRY_DELAY_MS, attempt + 1);
                } else {
                    pending.delete(eventId);
                    safeConsoleError('[kroegentocht-google-sheet.utils.ts][scheduleKroegSheetSync]', error);
                }
            }
        })();
    }, delayMs));
}
