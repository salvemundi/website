import { UNTRUSTED_NOTICE } from './instructions.js';
import type { Freshness } from './graph/source.js';

export interface ToolResult { [key: string]: unknown; content: { type: 'text'; text: string }[]; isError?: boolean }

export function bronMeta(s: Freshness) {
    return {
        bron: 'Samu Bijbel',
        bron_status: s.stale ? 'cache' : 'actueel',
        opgehaald_op: s.fetchedAt.toISOString(),
        ...(s.stale ? { waarschuwing: 'De bron was niet bereikbaar; dit zijn eerder opgehaalde gegevens en ze zijn mogelijk niet actueel.' } : {}),
        let_op: UNTRUSTED_NOTICE,
    };
}

export function ok(payload: Record<string, unknown>): ToolResult {
    return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

export function notFound(reden: string, extra: Record<string, unknown> = {}): ToolResult {
    return ok({ bron: 'Samu Bijbel', status: 'niet_gevonden', melding: `${reden} Deze informatie is niet in de Samu Bijbel gevonden. Vul dit niet zelf aan.`, ...extra });
}

export function fail(melding: string): ToolResult {
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({ bron: 'Samu Bijbel', status: 'fout', melding }) }] };
}
