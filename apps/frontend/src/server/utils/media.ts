import { safeConsoleError } from '@/server/utils/logger';

type UploadResult = { success: true; id: string | null } | { success: false; error: string };

async function postFileToDirectus(file: File, logLabel: string): Promise<UploadResult> {
    const fileData = new FormData();
    fileData.append('file', file);

    try {
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
