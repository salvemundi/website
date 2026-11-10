import { mobileRoute } from '@/server/mobile/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = mobileRoute(async () => new Response(null, {
    status: 302, headers: { Location: 'salvemundi://tickets', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
}));
