import { mobileRoute, mobileError } from '@/server/mobile/http';
import { mobileAndroidAssociation } from '@/server/mobile/policy';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Android App Links (Digital Asset Links). Same acceptance gate as the Apple association file.
export const GET = mobileRoute(async () => {
    const association = mobileAndroidAssociation();
    if (!association) return mobileError('not_found', 'Niet gevonden.', 404);
    return Response.json([{
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: association.packageName, sha256_cert_fingerprints: association.fingerprints }
    }], { headers: { 'Cache-Control': 'public, max-age=300', 'Content-Type': 'application/json' } });
});
