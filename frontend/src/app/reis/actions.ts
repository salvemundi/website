'use server'

import { revalidatePath } from 'next/cache';

export async function updateTripSignup(id: number, data: any) {
    const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
    const token = process.env.DIRECTUS_API_KEY;

    if (!directusUrl || !token) {
        console.error('Missing Directus configuration', { directusUrl, hasToken: !!token });
        throw new Error('Server configuration error');
    }

    // Whitelist allowed fields for security since we use Admin token
    const payload = {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        // date_of_birth might NOT be in data if user didn't change it, but form sends it.
        date_of_birth: data.date_of_birth,
        id_document_type: data.id_document_type,
        allergies: data.allergies,
        special_notes: data.special_notes,
        willing_to_drive: data.willing_to_drive,

        // Allow email/phone updates too if they are in the form? 
        // Aanbetaling page includes email/phone? Yes implicitly in 'form' state but maybe not rendered as inputs?
        // Let's check Aanbetaling page. It creates name/dob inputs. Email/phone are displayed?
        // Let's include them just in case they are added later or present.
        email: data.email,
        phone_number: data.phone_number
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

    // Also remove empty strings for optional fields if that's desired? 
    // Usually Directus handles empty string as empty string. Null is null.
    // We send what we get.

    const response = await fetch(`${directusUrl}/items/trip_signups/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('[updateTripSignup] Failed:', text);
        throw new Error(`Failed to update signup: ${response.statusText}`);
    }

    // Revalidate relevant pages
    revalidatePath(`/reis/aanbetaling/${id}`);
    revalidatePath(`/reis/restbetaling/${id}`);
    revalidatePath(`/admin/reis`); // Update admin view too

    return true;
}
