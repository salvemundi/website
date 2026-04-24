'use server';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { boardHistorySchema, type Board } from '@salvemundi/validations/schema/board.zod';

/**
 * Fetch the entire board history from Directus.
 * NUCLEAR SSR: This is called on the server to pre-fetch all history data.
 */
export async function getBoardHistory(): Promise<Board[]> {
    try {
        const boardsData = await getSystemDirectus().request(readItems('Board', {
            fields: [
                'id', 
                'image', 
                'naam', 
                'year',
                { 
                    members: [
                        'id', 
                        'functie', 
                        'name',
                        { user_id: ['id', 'first_name', 'last_name', 'avatar', 'title'] }
                    ] 
                } as any
            ],
            sort: ['-year'],
            limit: -1
        }));

        if (!boardsData || boardsData.length === 0) {
            return [];
        }

        const parsed = boardHistorySchema.safeParse(boardsData);

        if (!parsed.success) {
            console.error('[BoardActions] Schema validation failed:', parsed.error.format());
            // Return raw data if parsing fails but it exists, or handle gracefully
            return (boardsData as any[]).map(b => ({
                id: b.id,
                image: b.image,
                naam: b.naam,
                year: b.year,
                members: b.members || []
            })) as Board[];
        }

        return parsed.data;
    } catch (err) {
        console.error('[BoardActions] Error fetching board history:', err);
        return [];
    }
}
