const MAX_STICKER_IMAGE_DIMENSION = 1600;
const STICKER_IMAGE_QUALITY = 0.8;
const STICKER_IMAGE_SIZE_THRESHOLD = 900 * 1024;

export async function readFileAsDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Kon afbeeldingsvoorbeeld niet laden.'));
        reader.readAsDataURL(file);
    });
}

async function loadImageForCompression(file: File): Promise<{ width: number; height: number; cleanup: () => void; drawSource: CanvasImageSource }> {
    if ('createImageBitmap' in window) {
        const bitmap = await window.createImageBitmap(file);
        return {
            width: bitmap.width,
            height: bitmap.height,
            drawSource: bitmap,
            cleanup: () => bitmap.close()
        };
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';

    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Kon afbeelding niet laden voor compressie.'));
        image.src = objectUrl;
    });

    return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        drawSource: image,
        cleanup: () => URL.revokeObjectURL(objectUrl)
    };
}

export async function compressStickerImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) return file;
    if (file.size <= STICKER_IMAGE_SIZE_THRESHOLD) return file;

    try {
        const image = await loadImageForCompression(file);
        const scale = Math.min(1, MAX_STICKER_IMAGE_DIMENSION / Math.max(image.width, image.height));
        const targetWidth = Math.max(1, Math.round(image.width * scale));
        const targetHeight = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            image.cleanup();
            return file;
        }

        context.drawImage(image.drawSource, 0, 0, targetWidth, targetHeight);
        image.cleanup();

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', STICKER_IMAGE_QUALITY);
        });

        if (!blob) return file;

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'sticker-photo';
        return new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
    } catch {
        return file;
    }
}
