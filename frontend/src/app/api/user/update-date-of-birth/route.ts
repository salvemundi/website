import { NextRequest, NextResponse } from 'next/server';

// Use internal Docker network URL for admin-api
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://admin-api-dev:3005';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { date_of_birth } = await request.json();

        if (!date_of_birth) {
            return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
        }

        // Proxy to admin-api which has elevated privileges
        const response = await fetch(`${ADMIN_API_URL}/api/user/update-date-of-birth`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date_of_birth }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to update date of birth via admin-api:', error);
            return NextResponse.json({ error: 'Failed to update date of birth' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating date of birth:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
