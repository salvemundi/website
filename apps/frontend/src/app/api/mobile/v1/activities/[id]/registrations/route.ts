import { mobileRoute } from '@/server/mobile/http';
import { registerMobileActivity } from '@/server/mobile/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return mobileRoute(r => registerMobileActivity(r, id))(request);
}
