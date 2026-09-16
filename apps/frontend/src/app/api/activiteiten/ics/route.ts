import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/server/actions/events/activiteiten/activiteiten-public.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { buildIcsCalendar } from '@/lib/utils/ics';
import { safeConsoleError } from '@/server/utils/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const session = await getEnrichedSession();
        if (!session || !session.user.email) {
            return new NextResponse('Je moet ingelogd zijn om de agenda te koppelen.', { status: 401 });
        }
        const email = session.user.email;

        const activities = await getActivities(email);

        const events = activities.map(activity => {
            const isSignedUp = !!activity.is_signed_up;
            const emoji = isSignedUp ? '🟢' : '🔴';
            const title = `${emoji} ${activity.name || 'Activiteit'}`;

            const datePart = activity.event_date ? activity.event_date.split('T')[0] : new Date().toISOString().split('T')[0];
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://salvemundi.nl';
            const activityUrl = `${baseUrl}/activiteiten/${activity.id}`;
            
            const descriptionParts: string[] = [];
            if (isSignedUp) {
                descriptionParts.push(`Je bent ingeschreven! Bekijk je tickets op: ${baseUrl}/mijn-tickets`);
            } else {
                descriptionParts.push(`Bekijk of schrijf je in via: ${activityUrl}`);
            }

            if (activity.short_description) {
                descriptionParts.push(`\n${activity.short_description}`);
            } else if (activity.description) {
                // Strip HTML tags for clean text presentation in calendar description
                const cleanDesc = activity.description.replace(/<[^>]*>/g, '').trim();
                if (cleanDesc) descriptionParts.push(`\n${cleanDesc}`);
            }

            return {
                uid: `salve-mundi-event-${activity.id}`,
                title,
                description: descriptionParts.join('\n'),
                location: activity.location || null,
                date: datePart,
                timeStart: activity.event_time || '19:00',
                timeEnd: activity.event_time_end || null
            };
        });

        const ics = buildIcsCalendar(events, 'Salve Mundi Activiteiten');

        const { searchParams } = new URL(request.url);
        const download = searchParams.get('download') === '1';

        const headers: Record<string, string> = {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
        };
        if (download) {
            headers['Content-Disposition'] = 'attachment; filename="salve-mundi-activiteiten.ics"';
        }

        return new NextResponse(ics, { status: 200, headers });
    } catch (error: unknown) {
        safeConsoleError('[route.ts][GET] Failed to build activities ICS feed:', error);
        return new NextResponse('Kon agenda niet ophalen', { status: 500 });
    }
}
