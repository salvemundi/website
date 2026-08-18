import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { fetchDirectusAssetBuffer } from '@/server/utils/media';

export interface NdaSignatureBlock {
    heading: string;
    name: string;
    signaturePngFileId: string;
    extraLines?: string[];
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;

/**
 * Loads an existing PDF from Directus and appends a new page containing a
 * signature block (heading, name, signature image, optional extra lines).
 * Never draws over the source document's own pages, so the uploaded NDA
 * content itself is never touched.
 */
export async function appendSignatureBlockToPdf(sourceFileId: string, block: NdaSignatureBlock): Promise<Buffer> {
    const [sourceBytes, signatureBytes] = await Promise.all([
        fetchDirectusAssetBuffer(sourceFileId),
        fetchDirectusAssetBuffer(block.signaturePngFileId),
    ]);

    const pdfDoc = await PDFDocument.load(sourceBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    page.drawText(block.heading, {
        x: MARGIN,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
    });
    y -= 32;

    page.drawText(block.name, {
        x: MARGIN,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });
    y -= 24;

    for (const line of block.extraLines ?? []) {
        page.drawText(line, {
            x: MARGIN,
            y,
            size: 11,
            font,
            color: rgb(0.25, 0.25, 0.25),
        });
        y -= 18;
    }
    y -= 16;

    const maxSignatureWidth = 220;
    const scale = Math.min(1, maxSignatureWidth / signatureImage.width);
    const signatureWidth = signatureImage.width * scale;
    const signatureHeight = signatureImage.height * scale;

    page.drawImage(signatureImage, {
        x: MARGIN,
        y: y - signatureHeight,
        width: signatureWidth,
        height: signatureHeight,
    });

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}
