import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://directus.salvemundi.nl';
const MEMBERSHIP_API_URL = process.env.NEXT_PUBLIC_MEMBERSHIP_API_URL || 'https://membership-api.salvemundi.nl';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { date_of_birth } = await request.json();

        if (!date_of_birth) {
            return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
        }

        // Get current user to find their Entra ID
        const userResponse = await fetch(`${DIRECTUS_URL}/users/me?fields=id,entra_id`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch user' }, { status: 401 });
        }

        const userData = await userResponse.json();
        const user = userData?.data || userData;

        // Update Directus
        const updateResponse = await fetch(`${DIRECTUS_URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date_of_birth }),
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.error('Failed to update Directus:', error);
            return NextResponse.json({ error: 'Failed to update date of birth in Directus' }, { status: 500 });
        }

        // Update Azure AD if user has entra_id
        if (user.entra_id) {
            try {
                const azureResponse = await fetch(`${MEMBERSHIP_API_URL}/update-attributes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: user.entra_id,
                        date_of_birth: date_of_birth,
                    }),
                });

                if (!azureResponse.ok) {
                    console.error('Failed to update Azure AD, but Directus was updated');
                    // Don't fail the request, Directus is updated
                }
            } catch (azureError) {
                console.error('Error updating Azure AD:', azureError);
                // Don't fail the request, Directus is updated
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating date of birth:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
