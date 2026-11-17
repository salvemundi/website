import { NextRequest, NextResponse } from 'next/server';
import { timingSafeCompare } from '@salvemundi/validations/security';
import { runCameraReturnRemindersInternal } from '@/server/actions/beheer/camera/camera-reminders.internal';
import { safeConsoleError } from '@/server/utils/logger';

export async function GET(request: NextRequest) {
    const secret = (process.env.CRON_SECRET || '').trim();
    const authHeader = request.headers.get('authorization') || '';

    if (!secret || !timingSafeCompare(authHeader, `Bearer ${secret}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runCameraReturnRemindersInternal();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        safeConsoleError('[camera-return-reminders/route.ts][GET] Failed to send reminders:', error);
        return NextResponse.json({ error: 'Camera reminders failed' }, { status: 500 });
    }
}
