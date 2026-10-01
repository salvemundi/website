import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/server/actions/events/activiteiten/activiteiten-public.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { verifyCalendarToken } from '@/server/auth/calendar-token';
import { buildIcsResponse } from '@/lib/utils/ics';
import { safeConsoleError } from '@/server/utils/logger';
import { checkRateLimit } from '@/server/utils/ratelimit';
import { resolveRequestOrigin } from '@/server/utils/request-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        try {
            const rateLimitResult = await checkRateLimit('activiteiten-ics-feed', 120, 60, 'Te veel verzoeken. Probeer het over een minuut opnieuw.');
            if (!rateLimitResult.success) {
                return new NextResponse('Too Many Requests', { status: 429 });
            }
        } catch (rlError) {
            safeConsoleError('[route.ts][GET] Rate limit check failed open:', rlError);
        }

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const download = searchParams.get('download') === '1';

        let email: string | undefined = undefined;

        if (token) {
            const verified = verifyCalendarToken(token);
            if (verified?.email) {
                email = verified.email;
            }
        }

        if (!email) {
            const session = await getEnrichedSession().catch(() => null);
            if (session?.user.email) {
                email = session.user.email;
            }
        }

        const activities = await getActivities(email);
        const origin = resolveRequestOrigin(request);

        const events = activities.map(activity => {
            const isPersonalized = Boolean(email);
            const isSignedUp = Boolean(activity.is_signed_up);
            const emoji = isPersonalized ? (isSignedUp ? '🟢 ' : '🔴 ') : '';
            const title = `${emoji}${activity.name || 'Activiteit'}`;

            const datePart = activity.event_date ? activity.event_date.split('T')[0] : new Date().toISOString().split('T')[0];
            const activityUrl = `${origin}/activiteiten/${activity.id}`;
            
            const descriptionParts: string[] = [];
            if (isPersonalized) {
                if (isSignedUp) {
                    descriptionParts.push(`Je bent ingeschreven! Bekijk je tickets op: ${origin}/mijn-tickets`);
                } else {
                    descriptionParts.push(`Bekijk of schrijf je in via: ${activityUrl}`);
                }
            } else {
                descriptionParts.push(`Bekijk meer informatie en schrijf je in via: ${activityUrl}`);
            }

            if (activity.short_description) {
                descriptionParts.push(`\n${activity.short_description}`);
            } else if (activity.description) {
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

        const calendarName = email ? 'Salve Mundi Mijn Activiteiten' : 'Salve Mundi Activiteiten';

        return buildIcsResponse(events, calendarName, {
            filename: 'salve-mundi-activiteiten.ics',
            cacheControl: email ? 'private' : 'public',
            download,
        });
    } catch (error: unknown) {
        safeConsoleError('[route.ts][GET] Failed to build activities ICS feed:', error);
        return new NextResponse('Kon agenda niet ophalen', { status: 500 });
    }
}

