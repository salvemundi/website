import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Geldig e-mailadres is vereist' },
        { status: 400 }
      );
    }

    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_ADMIN_TOKEN;

    if (!directusUrl || !directusToken) {
      console.error('Missing Directus configuration');
      return NextResponse.json(
        { error: 'Server configuratie fout' },
        { status: 500 }
      );
    }

    // Check if email already exists in intro_newsletter_subscribers
    const checkResponse = await fetch(
      `${directusUrl}/items/intro_newsletter_subscribers?filter[email][_eq]=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (checkResponse.ok) {
      const existingData = await checkResponse.json();
      if (existingData.data && existingData.data.length > 0) {
        return NextResponse.json(
          { message: 'Je bent al ingeschreven!' },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    const createResponse = await fetch(
      `${directusUrl}/items/intro_newsletter_subscribers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subscribed_at: new Date().toISOString(),
          is_active: true,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Failed to create subscriber:', errorData);
      throw new Error('Failed to subscribe');
    }

    return NextResponse.json(
      { message: 'Succesvol ingeschreven!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het inschrijven' },
      { status: 500 }
    );
  }
}
