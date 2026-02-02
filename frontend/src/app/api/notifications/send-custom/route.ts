import { NextRequest, NextResponse } from 'next/server';

// Always use the public notification API URL for all environments
// This ensures consistency across dev, preprod, and production
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'https://notifications.salvemundi.nl';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: notificationBody, data, icon, badge, tag } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    console.log('[Custom Notification API] Calling notification API:', NOTIFICATION_API_URL);

    // Call the notification API from the server-side
    const response = await fetch(`${NOTIFICATION_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: notificationBody,
        data,
        icon,
        badge,
        tag
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Custom Notification API] Notification API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send notification', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[Custom Notification API] Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Custom Notification API] Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
