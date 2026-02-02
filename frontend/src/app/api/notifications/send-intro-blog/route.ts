import { NextRequest, NextResponse } from 'next/server';

// Always use the public notification API URL for all environments
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'https://notifications.salvemundi.nl';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, blogTitle } = body;

    if (!blogId || !blogTitle) {
      return NextResponse.json(
        { error: 'Blog ID and title are required' },
        { status: 400 }
      );
    }

    console.log('[Intro Blog Notification API] Calling notification API:', NOTIFICATION_API_URL);

    // Call the notification API from the server-side
    const response = await fetch(`${NOTIFICATION_API_URL}/notify-new-intro-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blogId,
        blogTitle
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Intro Blog Notification API] Notification API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send notification', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[Intro Blog Notification API] Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Intro Blog Notification API] Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
