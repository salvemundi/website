import { query } from '@/lib/database';
import { boardHistorySchema, type Board } from '@salvemundi/validations/schema/board.zod';
import { cacheLife } from 'next/cache';

/**
 * Fetch the entire board history from PostgreSQL.
 * NUCLEAR SSR: This is called on the server to pre-fetch all history data.
 */
export async function getBoardHistory(): Promise<Board[]> {
    'use cache';
    cacheLife('hours');

    const sql = `
        SELECT 
            b.id,
            b.image,
            b.naam,
            b.year,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', bm.id,
                        'functie', bm.functie,
                        'name', bm.name,
                        'user_id', CASE WHEN u.id IS NOT NULL THEN json_build_object(
                            'id', u.id,
                            'first_name', u.first_name,
                            'last_name', u.last_name,
                            'avatar', u.avatar,
                            'title', u.title
                        ) ELSE NULL END
                    )
                ) FILTER (WHERE bm.id IS NOT NULL),
                '[]'
            ) as members
        FROM "Board" b
        LEFT JOIN "Board_Members" bm ON b.id = bm.board_id
        LEFT JOIN directus_users u ON bm.user_id = u.id
        GROUP BY b.id
        ORDER BY b.year DESC
    `;

    const { rows } = await query(sql);
    
    const parsed = boardHistorySchema.safeParse(rows);

    if (!parsed.success) {
        console.error('[BoardActions] Schema validation failed:', JSON.stringify(parsed.error.format(), null, 2));
        // We log the error but still return empty for the UI to prevent a total crash, 
        // however by removing the try-catch we ensure query errors are seen.
        return [];
    }

    return parsed.data;
}
