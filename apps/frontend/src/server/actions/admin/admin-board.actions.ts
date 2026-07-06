import { db } from '@/lib/database/db';
import { boardHistorySchema, type Board } from '@salvemundi/validations/schema/board.zod';
import { safeConsoleError } from '@/server/utils/logger';

export async function getBoardHistory(): Promise<Board[]> {
    try {
        const rows = await db.query.Board.findMany({
            columns: {
                id: true,
                image: true,
                naam: true,
                year: true,
            },
            with: {
                Board_Members: {
                    columns: {
                        id: true,
                        functie: true,
                        name: true,
                    },
                    with: {
                        directus_user: {
                            columns: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                avatar: true,
                                title: true,
                            }
                        }
                    }
                }
            },
            orderBy: (board, { desc }) => [desc(board.year)]
        });

        const mappedRows = rows.map(b => ({
            id: b.id,
            image: b.image,
            naam: b.naam,
            year: b.year,
            members: b.Board_Members.map(bm => ({
                id: bm.id,
                functie: bm.functie,
                name: bm.name,
                user_id: bm.directus_user ? {
                    id: bm.directus_user.id,
                    first_name: bm.directus_user.first_name,
                    last_name: bm.directus_user.last_name,
                    avatar: bm.directus_user.avatar,
                    title: bm.directus_user.title
                } : null
            }))
        }));

        const parsed = boardHistorySchema.safeParse(mappedRows);

        if (!parsed.success) {
            safeConsoleError('[board.actions.ts][getBoardHistory] Zod validation failed', parsed.error);
            return [];
        }

        return parsed.data;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[board.actions.ts][getBoardHistory] SQL Query failed:', message);
        return [];
    }
}
