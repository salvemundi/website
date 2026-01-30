'use server'

import { revalidatePath } from 'next/cache';

export async function updateTripSignup(id: number, data: any) {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        // Check standard env var AND fallback to public one just in case (matching api/files/route.ts)
        const token = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;

        if (!directusUrl || !token) {
            console.error('[updateTripSignup] Missing Directus configuration', { directusUrl, hasToken: !!token });
            return { success: false, error: 'Server configuratiefout: API Key ontbreekt' };
        }

        // Whitelist allowed fields for security
        const payload = {
            first_name: data.first_name,
            middle_name: data.middle_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            id_document_type: data.id_document_type,
            // Map to potential DB column name variants
            id_document: data.id_document_type,
            document_number: data.document_number,

            allergies: data.allergies,
            // Map to DB typo 'alergies'
            alergies: data.allergies,

            special_notes: data.special_notes,
            willing_to_drive: data.willing_to_drive,
            email: data.email,
            phone_number: data.phone_number
        };

        // Remove undefined values
        Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

        console.log('[updateTripSignup] Updating ID:', id, 'Payload:', JSON.stringify(payload));

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
            console.error('[updateTripSignup] Directus error:', response.status, text);
            return { success: false, error: `Opslaan mislukt: ${response.statusText}` };
        }

        // Revalidate relevant pages
        revalidatePath(`/reis/aanbetaling/${id}`);
        revalidatePath(`/reis/restbetaling/${id}`);
        revalidatePath(`/admin/reis`);

        return { success: true };

    } catch (e: any) {
        console.error('[updateTripSignup] Unexpected error:', e);
        return { success: false, error: e.message || 'Onverwachte fout opgetreden' };
    }
}
