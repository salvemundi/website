import { NextRequest, NextResponse } from 'next/server';
import { getIntroPlanningPublic } from '@/server/actions/public/intro.actions';
import { buildIcsResponse } from '@/lib/utils/ics';
import { safeConsoleError } from '@/server/utils/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const download = searchParams.get('download') === '1';

        const planning = await getIntroPlanningPublic();

        const events = planning.map(item => ({
            uid: `intro-planning-${item.id}`,
            title: item.title,
            description: item.description,
            location: item.location,
            date: item.date,
            timeStart: item.time_start,
            timeEnd: item.time_end,
        }));

        return buildIcsResponse(events, 'Salve Mundi Introductie', {
            filename: 'salve-mundi-intro-planning.ics',
            cacheControl: 'public',
            download,
        });
    } catch (error: unknown) {
        safeConsoleError('[route.ts][GET] Failed to build intro planning ICS feed:', error);
        return new NextResponse('Kon planning niet ophalen', { status: 500 });
    }
}
