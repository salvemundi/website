import { NextRequest, NextResponse } from 'next/server';
import { getCoboGuestBoardsDb, getActiveBoardMembersDb } from '@/server/queries/cobo/admin-cobo.queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const coboId = searchParams.get('coboId');
    const includeMembers = searchParams.get('includeMembers') === 'true';

    if (!coboId || isNaN(Number(coboId))) {
        return NextResponse.json({ error: 'Geldig coboId is verplicht' }, { status: 400 });
    }

    const coboIdNum = Number(coboId);

    const [guestBoards, boardMembers] = await Promise.all([
        getCoboGuestBoardsDb(coboIdNum),
        includeMembers ? getActiveBoardMembersDb(coboIdNum) : Promise.resolve(undefined)
    ]);

    const currentBoard = guestBoards.find(b => b.status === 'current') || null;
    const waitingBoards = guestBoards.filter(b => b.status === 'waiting');
    const lateBoards = guestBoards.filter(b => b.status === 'late');
    const completedBoards = guestBoards.filter(b => b.status === 'completed');

    return NextResponse.json({
        success: true,
        coboId: coboIdNum,
        guestBoards,
        allBoards: guestBoards,
        ...(boardMembers !== undefined && { boardMembers }),
        currentBoard,
        waitingBoards,
        lateBoards,
        completedBoards,
        timestamp: new Date().toISOString()
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
    });
}

