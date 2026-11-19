import 'server-only';
import { pool } from '@/lib/database/db';
import { MobileError } from './http';

export interface SessionColumns {
    readonly userId: string;
    readonly expiresAt: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly userAgent: string;
}

let cachedColumns: SessionColumns | undefined;
let pendingColumns: Promise<SessionColumns> | undefined;

function physicalColumn(columns: Set<string>, camel: string, snake: string): string {
    // Only these caller-owned, fixed identifiers can enter SQL. Never prefer one
    // layout when both columns exist: that could validate a different session.
    const matches = [camel, snake].filter(candidate => columns.has(candidate));
    if (matches.length !== 1) {
        throw new MobileError('configuration_error', 'Aanmelden is tijdelijk niet beschikbaar. Probeer later opnieuw.', 503);
    }
    return `"${matches[0]}"`;
}

async function resolveSessionColumns(): Promise<SessionColumns> {
    const result = await pool.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema=current_schema() AND table_name='auth_sessions'
    `);
    const columns = new Set(result.rows.map(row => row.column_name));
    if (!columns.has('id') || !columns.has('token')) {
        throw new MobileError('configuration_error', 'Aanmelden is tijdelijk niet beschikbaar. Probeer later opnieuw.', 503);
    }
    return Object.freeze({
        userId: physicalColumn(columns, 'userId', 'user_id'),
        expiresAt: physicalColumn(columns, 'expiresAt', 'expires_at'),
        createdAt: physicalColumn(columns, 'createdAt', 'created_at'),
        updatedAt: physicalColumn(columns, 'updatedAt', 'updated_at'),
        userAgent: physicalColumn(columns, 'userAgent', 'user_agent')
    });
}

export async function getSessionColumns(): Promise<SessionColumns> {
    if (cachedColumns) return cachedColumns;
    if (pendingColumns) return pendingColumns;
    const pending = resolveSessionColumns();
    pendingColumns = pending;
    try {
        const columns = await pending;
        cachedColumns = columns;
        return columns;
    } finally {
        // A failed metadata lookup must be retried after configuration recovers.
        if (pendingColumns === pending) pendingColumns = undefined;
    }
}
