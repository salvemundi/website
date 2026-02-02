import { NextRequest, NextResponse } from 'next/server';

// Always use the public notification API URL for all environments
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'https://notifications.salvemundi.nl';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daysBeforeExpiry = 30 } = body;

    console.log('[Membership Reminder API] Sending reminders for members expiring within', daysBeforeExpiry, 'days');

    const notificationUrl = `${NOTIFICATION_API_URL}/notify-membership-renewal-reminder`;
    console.log('[Membership Reminder API] Calling notification API:', notificationUrl);

    // Call the notification API from the server-side with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysBeforeExpiry }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[Membership Reminder API] Response status:', response.status);

      if (!response.ok) {
        let errorText;
        try {
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
          console.error('[Membership Reminder API] Notification API error (JSON):', response.status, errorJson);
        } catch {
          errorText = await response.text();
          console.error('[Membership Reminder API] Notification API error (text):', response.status, errorText);
        }
        return NextResponse.json(
          { error: 'Failed to send membership reminder notification', details: errorText },
          { status: response.status }
        );
      }

      const result = await response.json();
      console.log('[Membership Reminder API] Success:', result);
      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[Membership Reminder API] Request timeout after 30 seconds');
        throw new Error('Request to notification API timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Membership Reminder API] Error sending membership reminder notification:', error);
    console.error('[Membership Reminder API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
