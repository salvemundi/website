import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Config } from '../config.js';
import { bronMeta, fail, notFound, ok, type ToolResult } from '../envelope.js';
import { AccessDeniedError } from '../graph/client.js';
import type { BijbelPage, BijbelSource } from '../graph/source.js';
import { SERVER_INSTRUCTIONS } from '../instructions.js';

const FRAGMENT_MAX = 500;
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

export function tokenize(q: string): string[] {
    return [...new Set(q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2))].slice(0, 8);
}

const count = (hay: string, needle: string) => hay.split(needle).length - 1;

export function searchPages(pages: BijbelPage[], tokens: string[]) {
    const hits: { page: BijbelPage; sectie: BijbelPage['secties'][number]; score: number; fragment: string; afgekapt: boolean }[] = [];
    for (const page of pages) {
        for (const sectie of page.secties) {
            const text = sectie.tekst.toLowerCase();
            const titleLc = `${page.titel} ${sectie.titel ?? ''}`.toLowerCase();
            const matched = tokens.filter((t) => text.includes(t) || titleLc.includes(t));
            if (matched.length === 0) continue;
            const score = matched.length * 1000 + tokens.reduce((n, t) => n + count(text, t) + 3 * count(titleLc, t), 0);
            // Fragment = letterlijke regel uit de bron met de eerste treffer.
            const line = sectie.tekst.split('\n').find((l) => tokens.some((t) => l.toLowerCase().includes(t))) ?? sectie.tekst;
            hits.push({ page, sectie, score, fragment: line.slice(0, FRAGMENT_MAX), afgekapt: line.length > FRAGMENT_MAX });
        }
    }
    return hits.sort((a, b) => b.score - a.score || a.page.id.localeCompare(b.page.id) || a.sectie.nummer - b.sectie.nummer);
}

const cursorSchema = z.string().regex(/^\d{1,7}$/).optional().describe('Ondoorzichtige cursor uit een vorig antwoord');

/** Vertaalt bronfouten naar een generieke toolfout; geeft nooit inhoud, stacktraces of infra-details terug. */
async function guarded(fn: () => Promise<ToolResult>): Promise<ToolResult> {
    try {
        return await fn();
    } catch (e) {
        if (e instanceof AccessDeniedError) {
            return fail('Geen toegang tot de Samu Bijbel met dit account via deze koppeling. Er is geen antwoord beschikbaar; vraag een beheerder om toegang.');
        }
        return fail('De Samu Bijbel is tijdelijk niet bereikbaar. Probeer het later opnieuw; er is geen antwoord beschikbaar.');
    }
}

type ToolCfg = Pick<Config, 'MCP_MAX_RESULTS' | 'MCP_MAX_RESPONSE_CHARS' | 'MCP_MAX_SEARCH_PAGES'>;

export function createMcpServer(source: BijbelSource, cfg: ToolCfg): McpServer {
    const server = new McpServer({ name: 'samu-bijbel', version: '1.1.0' }, { instructions: SERVER_INSTRUCTIONS });

    server.registerTool(
        'lijst_bijbel_paginas',
        {
            title: 'Lijst Samu Bijbel-pagina\'s',
            description: 'Geeft pagina-ID\'s, titels en bronlinks van gepubliceerde Samu Bijbel-pagina\'s (gepagineerd). Gebruik het pagina_id met lees_bijbel_pagina.',
            inputSchema: { limit: z.number().int().min(1).max(25).optional(), cursor: cursorSchema },
            annotations: READ_ONLY,
        },
        ({ limit, cursor }) =>
            guarded(async () => {
                const snap = await source.list();
                const all = [...snap.pages].sort((a, b) => a.titel.localeCompare(b.titel) || a.id.localeCompare(b.id));
                const offset = cursor ? Number(cursor) : 0;
                if (all.length === 0 || offset >= all.length) return notFound('Geen pagina\'s beschikbaar.');
                const max = Math.min(limit ?? cfg.MCP_MAX_RESULTS, cfg.MCP_MAX_RESULTS);
                const paginas: unknown[] = [];
                let size = 0;
                let i = offset;
                for (const p of all.slice(offset)) {
                    if (paginas.length >= max) break;
                    const item = { pagina_id: p.id, titel: p.titel, bron_url: p.url, gewijzigd: p.gewijzigd };
                    const len = JSON.stringify(item).length;
                    if (size + len > cfg.MCP_MAX_RESPONSE_CHARS && paginas.length > 0) break;
                    size += len;
                    paginas.push(item);
                    i++;
                }
                return ok({ ...bronMeta(snap), status: 'gevonden', totaal: all.length, paginas, volgende_cursor: i < all.length ? String(i) : null });
            }),
    );

    server.registerTool(
        'zoek_in_bijbel',
        {
            title: 'Zoek in de Samu Bijbel',
            description:
                `Zoekt (deterministisch, letterlijk op trefwoord) in maximaal ${cfg.MCP_MAX_SEARCH_PAGES} gepubliceerde Samu Bijbel-pagina's. Geeft letterlijke fragmenten met titel, bronlink en pagina-ID. Antwoord alleen op basis van de resultaten; bij "niet_gevonden" meld je dat expliciet, en bij zoekbereik_beperkt=true zijn niet alle pagina's doorzocht.`,
            inputSchema: {
                query: z.string().trim().min(2).max(200),
                limit: z.number().int().min(1).max(25).optional(),
                cursor: cursorSchema,
            },
            annotations: READ_ONLY,
        },
        ({ query, limit, cursor }) =>
            guarded(async () => {
                const tokens = tokenize(query);
                if (tokens.length === 0) return fail('Zoekopdracht bevat geen bruikbare zoektermen.');
                const snap = await source.searchSet(cfg.MCP_MAX_SEARCH_PAGES);
                const scope = { doorzochte_paginas: snap.pages.length, totaal_paginas: snap.totaal, zoekbereik_beperkt: snap.totaal > snap.pages.length };
                const hits = searchPages(snap.pages, tokens);
                const offset = cursor ? Number(cursor) : 0;
                const max = Math.min(limit ?? cfg.MCP_MAX_RESULTS, cfg.MCP_MAX_RESULTS);
                if (hits.length === 0 || offset >= hits.length) {
                    return notFound(`Geen resultaten voor "${query}" in ${snap.pages.length} doorzochte pagina's${scope.zoekbereik_beperkt ? ` (van ${snap.totaal}; niet alle pagina's zijn doorzocht)` : ''}.`, scope);
                }

                const resultaten: unknown[] = [];
                let size = 0;
                let i = offset;
                for (const h of hits.slice(offset)) {
                    if (resultaten.length >= max) break;
                    const item = {
                        pagina_id: h.page.id,
                        titel: h.page.titel,
                        bron_url: h.page.url,
                        sectie: { nummer: h.sectie.nummer, titel: h.sectie.titel },
                        gewijzigd: h.page.gewijzigd,
                        type: 'letterlijk_fragment',
                        inhoud: h.fragment,
                        afgekapt: h.afgekapt,
                    };
                    const len = JSON.stringify(item).length;
                    if (size + len > cfg.MCP_MAX_RESPONSE_CHARS && resultaten.length > 0) break;
                    size += len;
                    resultaten.push(item);
                    i++;
                }
                return ok({ ...bronMeta(snap), status: 'gevonden', totaal: hits.length, ...scope, resultaten, volgende_cursor: i < hits.length ? String(i) : null });
            }),
    );

    server.registerTool(
        'lees_bijbel_pagina',
        {
            title: 'Lees een Samu Bijbel-pagina',
            description:
                'Leest de letterlijke tekst van één gepubliceerde pagina (pagina_id uit lijst_bijbel_paginas of zoek_in_bijbel), optioneel één sectie. Lange tekst wordt in delen geleverd via volgende_cursor.',
            inputSchema: {
                pagina_id: z.uuid(),
                sectie: z.number().int().min(1).max(500).optional(),
                cursor: cursorSchema,
            },
            annotations: READ_ONLY,
        },
        ({ pagina_id, sectie, cursor }) =>
            guarded(async () => {
                // Alleen ID's uit de allowlist (gepubliceerd + toegestaan pad) zijn leesbaar; anders null.
                const r = await source.read(pagina_id);
                if (!r) return notFound('Deze pagina bestaat niet of is niet beschikbaar.');
                const { page } = r;
                const secties = sectie === undefined ? page.secties : page.secties.filter((s) => s.nummer === sectie);
                if (secties.length === 0) return notFound('Deze sectie bestaat niet.');
                const full = secties.map((s) => (s.titel ? `[Sectie ${s.nummer}: ${s.titel}]` : `[Sectie ${s.nummer}]`) + `\n${s.tekst}`).join('\n\n');
                const start = cursor ? Number(cursor) : 0;
                if (start >= full.length) return notFound('Cursor ligt voorbij het einde van de tekst.');
                const end = Math.min(start + cfg.MCP_MAX_RESPONSE_CHARS, full.length);
                return ok({
                    ...bronMeta(r),
                    status: 'gevonden',
                    pagina_id: page.id,
                    titel: page.titel,
                    bron_url: page.url,
                    gewijzigd: page.gewijzigd,
                    type: 'letterlijke_tekst',
                    inhoud: full.slice(start, end),
                    bereik: { van: start, tot: end, totaal: full.length },
                    volgende_cursor: end < full.length ? String(end) : null,
                });
            }),
    );

    return server;
}
