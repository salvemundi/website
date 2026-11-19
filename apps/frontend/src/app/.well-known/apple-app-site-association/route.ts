import { mobileRoute, mobileError } from '@/server/mobile/http';
import { mobileAssociationID } from '@/server/mobile/policy';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const GET = mobileRoute(async () => {
    const appID = mobileAssociationID();
    if (!appID) return mobileError('not_found', 'Niet gevonden.', 404);
    return Response.json({ applinks: { details: [{ appIDs: [appID], components: [
        { '/': '/activiteiten/*' }, { '/': '/profiel/tickets*' }, { '/': '/api/mobile/v1/payment-return' }
    ] }] } }, { headers: { 'Cache-Control': 'public, max-age=300', 'Content-Type': 'application/json' } });
});
