'use server';

/**
 * Server Action to upload a file to Directus.
 * Handles FormData directly on the server.
 */
export async function uploadFileAction(formData: FormData) {
    try {
        const directusApiUrl = process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
        const apiKey = process.env.DIRECTUS_ADMIN_TOKEN || '';

        const response = await fetch(`${directusApiUrl}/files`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[FileAction] Upload failed:', {
                status: response.status,
                body: errorText
            });
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        return { success: true, data: json.data };
    } catch (error: any) {
        console.error('[FileAction] Error:', error.message);
        return { success: false, error: error.message || 'Upload mislukt.' };
    }
}
