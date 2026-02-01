
import { NextRequest, NextResponse } from 'next/server';
import { sendPubCrawlSignupEmail } from '@/shared/lib/services/email-service';
import qrService from '@/shared/lib/qr-service';
import { directusFetch } from '@/shared/lib/directus';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { signupId } = body;

        console.log('[API] Sending Pub Crawl tickets for signup:', signupId);

        if (!signupId) {
            return NextResponse.json({ error: 'Missing signupId' }, { status: 400 });
        }

        // Fetch signup with event details
        const signup = await directusFetch<any>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}/${signupId}?fields=*,${FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID}.*`);

        if (!signup) {
            return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
        }

        if (signup[FIELDS.SIGNUPS.PAYMENT_STATUS] !== 'paid') {
            return NextResponse.json({ error: 'Signup is not paid yet' }, { status: 400 });
        }

        const email = signup[FIELDS.SIGNUPS.EMAIL];
        const eventId = signup[FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID]?.id;

        if (!email || !eventId) {
            return NextResponse.json({ error: 'Missing email or eventId' }, { status: 400 });
        }

        // Fetch all PAID signups for this email and event
        const allPaidSignups = await directusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}?filter[${FIELDS.SIGNUPS.EMAIL}][_eq]=${encodeURIComponent(email)}&filter[${FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID}][_eq]=${eventId}&filter[${FIELDS.SIGNUPS.PAYMENT_STATUS}][_eq]=paid&fields=id`);

        const signupIds = allPaidSignups.map(s => s.id);

        // Fetch all tickets for these signups
        const allTickets = await directusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}?filter[${FIELDS.TICKETS.SIGNUP_ID}][_in]=${signupIds.join(',')}&fields=*`);

        if (allTickets.length === 0) {
            return NextResponse.json({ error: 'No tickets found for these signups' }, { status: 404 });
        }

        // Generate QR codes for each ticket
        const ticketsWithQR = await Promise.all(allTickets.map(async (ticket: any) => {
            const qrDataUrl = await qrService.generateQRCode(ticket[FIELDS.TICKETS.QR_TOKEN]);
            return {
                name: ticket[FIELDS.TICKETS.NAME],
                initial: ticket[FIELDS.TICKETS.INITIAL],
                qrCodeDataUrl: qrDataUrl
            };
        }));

        // Send Email
        const eventName = signup[FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID]?.name || 'Kroegentocht';
        const eventDate = signup[FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID]?.date || new Date().toISOString();

        await sendPubCrawlSignupEmail({
            recipientEmail: email,
            recipientName: signup[FIELDS.SIGNUPS.NAME],
            eventName: eventName,
            eventDate: eventDate,
            participants: ticketsWithQR
        });

        console.log('[API] Pub Crawl tickets sent successfully');
        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[API] Failed to send pub crawl tickets:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
