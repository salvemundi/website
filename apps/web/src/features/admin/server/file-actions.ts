'use server';

import { verifyUserPermissions } from './secure-check';

/**
 * Securely upload a file to Directus via a Server Action.
 * This ensures the client never sees the Admin Token.
 */
export async function uploadFileAction(formData: FormData): Promise<{ id: string }> {
    // Basic auth check - any logged in user can upload? 
    // Usually we want to restrict this to admin/committee members.
    await verifyUserPermissions({});

    const directusApiUrl = process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    const apiKey = process.env.DIRECTUS_ADMIN_TOKEN || '';

    try {
        const response = await fetch(`${directusApiUrl}/files`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
                // Important: Do NOT set Content-Type header when sending FormData.
                // The fetch API will automatically set it with the correct boundary.
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[uploadFileAction] Directus error:', errorText);
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const json = await response.json();
        // Directus returns { data: { id: ... } } or just the item data depending on version
        return { id: json.data?.id || json.data };
    } catch (error) {
        console.error('[uploadFileAction] failed:', error);
        throw error;
    }
}
