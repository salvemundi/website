import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_API_URL = process.env.NOTIFICATION_API_URL || 'http://notification-api-prod:3003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Call the notification API from the server-side
    const response = await fetch(`${NOTIFICATION_API_URL}/notify-event-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notification API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send reminder notification' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
