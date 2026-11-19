import { NextResponse, type NextRequest } from 'next/server';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { getEnrichedSession, requireBeheerFeature } from '@/server/auth/auth-utils';
import { safeConsoleError } from '@/server/utils/logger';
import {
    TICKET_COOKIE_NAME,
    decodeTicketCookie,
    fetchSignupTicketInfo
} from '@/server/internal/kroegentocht/kroegentocht-ticket-access.utils';
import { buildTicketsPdf } from '@/server/internal/kroegentocht/kroegentocht-ticket-pdf.utils';

export const dynamic = 'force-dynamic';

/**
 * Download van de tickets (PDF met QR-codes) van één inschrijving.
 * Toegang voor: bezoeker met de ticket-cookie (na betalen, 14 dagen), de ingelogde
 * eigenaar van de inschrijving, of een kroegentocht-beheerder.
 */
async function hasAccess(request: NextRequest, signupId: number): Promise<boolean> {
    if (decodeTicketCookie(request.cookies.get(TICKET_COOKIE_NAME)?.value).includes(signupId)) return true;

    const session = await getEnrichedSession().catch(() => null);
    if (!session) return false;

    const owner = (await db.select({ userId: schema.pub_crawl_signups.directus_relations })
        .from(schema.pub_crawl_signups)
        .where(eq(schema.pub_crawl_signups.id, signupId))
        .limit(1)).at(0);
    if (owner?.userId && owner.userId === session.user.id) return true;

    try {
        await requireBeheerFeature('kroegentocht');
        return true;
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ signupId: string }> }) {
    const signupId = Number((await params).signupId);
    if (!Number.isInteger(signupId) || signupId <= 0) {
        return NextResponse.json({ error: 'Ongeldige inschrijving' }, { status: 400 });
    }

    try {
        if (!(await hasAccess(request, signupId))) {
            return NextResponse.json({ error: 'Geen toegang tot deze tickets' }, { status: 403 });
        }
        const info = await fetchSignupTicketInfo(signupId);
        if (!info || info.tickets.length === 0) {
            return NextResponse.json({ error: 'Geen tickets gevonden' }, { status: 404 });
        }

        const pdf = await buildTicketsPdf(info);
        const safeEvent = info.eventName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        return new NextResponse(Buffer.from(pdf), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeEvent}-tickets-${signupId}.pdf"`,
                'Cache-Control': 'private, no-store'
            }
        });
    } catch (error: unknown) {
        safeConsoleError('[api/kroegentocht/tickets][GET]', error);
        return NextResponse.json({ error: 'Kon tickets niet genereren' }, { status: 500 });
    }
}
