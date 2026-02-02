import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_API_URL = process.env.NOTIFICATION_API_URL || 'http://notification-api-prod:3003';

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
      console.error('Notification API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
