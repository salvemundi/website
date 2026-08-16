import { NextRequest, NextResponse } from 'next/server';
import { getIntroPlanningPublic } from '@/server/actions/public/intro.actions';
import { buildIcsCalendar } from '@/lib/utils/ics';
import { logInternalError } from '@/server/utils/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const planning = await getIntroPlanningPublic();

        const ics = buildIcsCalendar(
            planning.map(item => ({
                uid: `intro-planning-${item.id}`,
                title: item.title,
                description: item.description,
                location: item.location,
                date: item.date,
                timeStart: item.time_start,
                timeEnd: item.time_end
            })),
            'Salve Mundi Introductie'
        );

        const { searchParams } = new URL(request.url);
        const download = searchParams.get('download') === '1';

        const headers: Record<string, string> = {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
        };
        if (download) {
            headers['Content-Disposition'] = 'attachment; filename="salve-mundi-intro-planning.ics"';
        }

        return new NextResponse(ics, { status: 200, headers });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logInternalError(`[route.ts][GET] Failed to build intro planning ICS feed: ${errorMessage}`, {});
        return new NextResponse('Kon planning niet ophalen', { status: 500 });
    }
}
