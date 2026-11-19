import { mobileRoute } from '@/server/mobile/http';
import { mobileActivity } from '@/server/mobile/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return mobileRoute(async () => mobileActivity(id))(request);
}
