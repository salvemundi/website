import { safeConsoleError } from '@/server/utils/logger';

export async function uploadToDirectus(file: File | null, maxSizeBytes: number = 10 * 1024 * 1024): Promise<{ success: true; id: string | null } | { success: false; error: string }> {
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
        safeConsoleError('[media.ts][uploadToDirectus]', `Uploaden van bestand mislukt: ${typedError.message}`);
        return { success: false, error: "Uploaden van het bestand is mislukt." };
    }
}