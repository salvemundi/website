
import { NextRequest, NextResponse } from 'next/server';
import { sendPubCrawlSignupEmail } from '@/shared/lib/services/email-service';
import qrService from '@/shared/lib/qr-service';
import { directusFetch } from '@/shared/lib/directus';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { signupId } = body;

        console.log('[API] Sending Pub Crawl tickets for signup:', signupId);

        if (!signupId) {
            return NextResponse.json({ error: 'Missing signupId' }, { status: 400 });
        }

        // Fetch signup with event details
        // Note: Using directusFetch directly here to ensure we get the relations we need
        // pubCrawlSignupsApi.getById might not return nested event fields deeply enough
        const signup = await directusFetch<any>(`/items/pub_crawl_signups/${signupId}?fields=*,pub_crawl_event_id.*`);

        if (!signup) {
            return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
        }

        if (signup.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Signup is not paid yet' }, { status: 400 });
        }

        const baseToken = signup.qr_token;
        if (!baseToken) {
            // Should not happen if flow is correct, but let's be safe
            return NextResponse.json({ error: 'QR token missing on signup' }, { status: 500 });
        }

        // Parse participants
        let participants = [];
        try {
            participants = signup.name_initials ? JSON.parse(signup.name_initials) : [];
        } catch (e) {
            participants = [];
        }

        if (participants.length === 0) {
            // Fallback for old data or empty participants
            participants = [{ name: signup.name, initial: '' }];
        }

        // Generate QR codes for each participant
        const participantsWithQR = await Promise.all(participants.map(async (p: any, index: number) => {
            const token = `${baseToken}#${index}`; // Composite token for individual check-in
            const qrDataUrl = await qrService.generateQRCode(token);
            return {
                name: p.name,
                initial: p.initial,
                qrCodeDataUrl: qrDataUrl
            };
        }));

        // Send Email
        const eventName = signup.pub_crawl_event_id?.name || 'Kroegentocht';
        const eventDate = signup.pub_crawl_event_id?.date || new Date().toISOString();

        await sendPubCrawlSignupEmail({
            recipientEmail: signup.email,
            recipientName: signup.name,
            eventName: eventName,
            eventDate: eventDate,
            participants: participantsWithQR
        });

        console.log('[API] Pub Crawl tickets sent successfully');
        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[API] Failed to send pub crawl tickets:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
