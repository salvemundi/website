import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { fetchDirectusAssetBuffer } from '@/server/utils/media';
import type { NdaSignatureLayout } from '@salvemundi/validations';

export interface NdaMemberSignatureFields {
    name: string;
    date: string;
    location: string;
    signaturePngFileId: string;
}

function fitText(text: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>, maxWidth: number, preferredSize: number): number {
    let size = preferredSize;
    while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) {
        size -= 0.5;
    }
    return size;
}

/**
 * Loads the secretary-uploaded NDA (already signed by voorzitter + secretaris
 * outside the app) and fills in the member's location, date, name and
 * signature directly onto the existing last page, at the spots the secretary
 * marked when calibrating the template's `signature_layout`, instead of
 * appending a new page.
 */
export async function fillMemberSignatureOnPdf(sourceFileId: string, layout: NdaSignatureLayout, fields: NdaMemberSignatureFields): Promise<Buffer> {
    const [sourceBytes, signatureBytes] = await Promise.all([
        fetchDirectusAssetBuffer(sourceFileId),
        fetchDirectusAssetBuffer(fields.signaturePngFileId),
    ]);

    const pdfDoc = await PDFDocument.load(sourceBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const scaleX = pageWidth / layout.pageWidth;
    const scaleY = pageHeight / layout.pageHeight;

    const locationSize = fitText(fields.location, font, layout.location.maxWidth * scaleX, 10.5 * scaleY);
    page.drawText(fields.location, {
        x: layout.location.x * scaleX,
        y: layout.location.y * scaleY,
        size: locationSize,
        font,
        color: rgb(0, 0, 0),
    });

    const dateSize = fitText(fields.date, font, layout.date.maxWidth * scaleX, 10.5 * scaleY);
    page.drawText(fields.date, {
        x: layout.date.x * scaleX,
        y: layout.date.y * scaleY,
        size: dateSize,
        font,
        color: rgb(0, 0, 0),
    });

    const nameSize = fitText(fields.name, font, layout.name.maxWidth * scaleX, 11 * scaleY);
    page.drawText(fields.name, {
        x: layout.name.x * scaleX,
        y: layout.name.y * scaleY,
        size: nameSize,
        font,
        color: rgb(0, 0, 0),
    });

    const boxWidth = layout.signature.width * scaleX;
    const boxHeight = layout.signature.height * scaleY;
    const fitScale = Math.min(boxWidth / signatureImage.width, boxHeight / signatureImage.height, 1);
    const signatureWidth = signatureImage.width * fitScale;
    const signatureHeight = signatureImage.height * fitScale;

    page.drawImage(signatureImage, {
        x: layout.signature.x * scaleX,
        y: layout.signature.y * scaleY,
        width: signatureWidth,
        height: signatureHeight,
    });

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}
