import { safeConsoleError } from '@/server/utils/logger';

type UploadResult = { success: true; id: string | null } | { success: false; error: string };

async function postFileToDirectus(file: File, logLabel: string): Promise<UploadResult> {
    try {
        // Re-materialize the file bytes into a fresh Blob rather than forwarding the
        // File object as-is: a File received through the server action boundary can
        // produce a truncated multipart body when re-appended to a second FormData,
        // which Directus's upload endpoint rejects with "Unexpected end of form".
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new FormData();
        fileData.append('file', new Blob([arrayBuffer], { type: file.type }), file.name);

        const token = process.env.DIRECTUS_STATIC_TOKEN;
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
        const res = await fetch(`${directusUrl}/files`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: fileData
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Directus API-fout: ${errorText}`);
        }

        const data = await res.json() as { data: { id: string } };
        return { success: true, id: data.data.id };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError(`[media.ts][${logLabel}]`, `Uploaden van bestand mislukt: ${typedError.message}`);
        return { success: false, error: "Uploaden van het bestand is mislukt." };
    }
}

export async function uploadToDirectus(file: File | null, maxSizeBytes: number = 10 * 1024 * 1024): Promise<UploadResult> {
    if (!file || file.size === 0 || file.name === 'undefined') {
        return { success: true, id: null };
    }

    if (file.size > maxSizeBytes) {
        const maxMb = maxSizeBytes / (1024 * 1024);
        return { success: false, error: `Bestand is te groot (max ${maxMb}MB).` };
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return { success: false, error: "Alleen afbeeldingen of video's zijn toegestaan." };
    }

    return postFileToDirectus(file, 'uploadToDirectus');
}

const ACCEPTED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function uploadDocumentToDirectus(file: File | null, maxSizeBytes: number = 10 * 1024 * 1024): Promise<UploadResult> {
    if (!file || file.size === 0 || file.name === 'undefined') {
        return { success: true, id: null };
    }

    if (file.size > maxSizeBytes) {
        const maxMb = maxSizeBytes / (1024 * 1024);
        return { success: false, error: `Bestand is te groot (max ${maxMb}MB).` };
    }

    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
        return { success: false, error: "Alleen .pdf, .doc en .docx bestanden zijn toegestaan." };
    }

    return postFileToDirectus(file, 'uploadDocumentToDirectus');
}

export async function uploadFormDataFile(
    formData: FormData,
    fieldName: string,
    type: 'image' | 'document' = 'image'
): Promise<{ success: true; data: string } | { success: false; error: string }> {
    const file = formData.get(fieldName) as File | null;
    if (!file || file.size === 0) {
        return { success: false, error: 'Geen bestand gevonden in upload.' };
    }

    try {
        const uploadResult = type === 'document'
            ? await uploadDocumentToDirectus(file)
            : await uploadToDirectus(file);

        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
        }
        if (!uploadResult.id) {
            return { success: false, error: 'Bestand uploaden mislukt op de server (geen ID teruggekregen).' };
        }
        return { success: true, data: uploadResult.id };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[media.ts][uploadFormDataFile]', `Failed to upload ${type}: ${typedError.message}`);
        return { success: false, error: 'Bestand uploaden mislukt op de server.' };
    }
}

