import { NextRequest, NextResponse } from 'next/server';
import { timingSafeCompare } from '@salvemundi/validations/security';
import { runNdaExpiryCheckInternal } from '@/server/actions/admin/nda/admin-nda-signatures.actions';
import { getNdaSettingsInternal } from '@/server/queries/nda/admin-nda.queries';
import { safeConsoleError } from '@/server/utils/logger';

export async function GET(request: NextRequest) {
    const secret = (process.env.CRON_SECRET || '').trim();
    const authHeader = request.headers.get('authorization') || '';

    if (!secret || !timingSafeCompare(authHeader, `Bearer ${secret}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getNdaSettingsInternal();
    if (!settings.isActive) {
        return NextResponse.json({ success: true, skipped: true, reason: 'NDA system is not active' });
    }

    try {
        const result = await runNdaExpiryCheckInternal();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        safeConsoleError('[nda-expiry-check/route.ts][GET] Failed to run NDA expiry check:', error);
        return NextResponse.json({ error: 'NDA expiry check failed' }, { status: 500 });
    }
}
