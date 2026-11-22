import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { renderTicketQrPng } from '@/server/internal/qr/qr-server';
import { type SignupTicketInfo } from './kroegentocht-ticket-access.utils';

const PURPLE = rgb(0.48, 0.17, 0.75);
const DARK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.4, 0.4, 0.4);

/** Standaardfonts in pdf-lib kennen alleen WinAnsi; vervang tekens die daar buiten vallen. */
function safeText(text: string): string {
    return text.replace(/[^ -~ -ÿ]/g, '?');
}

/** Maakt een PDF met één A4-pagina per ticket, met naam en QR-code (bestaande qr_token). */
export async function buildTicketsPdf(info: SignupTicketInfo): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Kroegentocht tickets - ${info.eventName}`);
    pdf.setCreator('Salve Mundi');
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);

    const dateText = info.eventDate
        ? new Date(info.eventDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })
        : '';

    for (const [index, ticket] of info.tickets.entries()) {
        const page = pdf.addPage([595.28, 841.89]); // A4
        const { width, height } = page.getSize();
        const center = (text: string, size: number, font: typeof bold) => (width - font.widthOfTextAtSize(text, size)) / 2;

        page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: PURPLE });
        const title = safeText(info.eventName.toUpperCase());
        page.drawText(title, { x: center(title, 26, bold), y: height - 70, size: 26, font: bold, color: rgb(1, 1, 1) });
        const sub = `Ticket ${index + 1} van ${info.tickets.length}`;
        page.drawText(sub, { x: center(sub, 13, regular), y: height - 98, size: 13, font: regular, color: rgb(1, 1, 1) });

        const name = safeText(`${ticket.name} ${ticket.initial ? `${ticket.initial}.` : ''}`.trim());
        page.drawText(name, { x: center(name, 34, bold), y: height - 200, size: 34, font: bold, color: DARK });
        if (dateText) {
            const d = safeText(dateText);
            page.drawText(d, { x: center(d, 14, regular), y: height - 228, size: 14, font: regular, color: MUTED });
        }

        const qrPng = await renderTicketQrPng(ticket.qrToken, 800);
        const qr = await pdf.embedPng(qrPng);
        const qrSize = 360;
        page.drawImage(qr, { x: (width - qrSize) / 2, y: height - 270 - qrSize, width: qrSize, height: qrSize });

        const hint = 'Laat deze QR-code scannen bij de start van de kroegentocht.';
        page.drawText(hint, { x: center(hint, 13, regular), y: height - 670, size: 13, font: regular, color: MUTED });
        const hint2 = 'Elke deelnemer heeft een eigen code. Niet delen met anderen.';
        page.drawText(hint2, { x: center(hint2, 11, regular), y: height - 690, size: 11, font: regular, color: MUTED });
        const footer = 'Salve Mundi';
        page.drawText(footer, { x: center(footer, 11, bold), y: 40, size: 11, font: bold, color: PURPLE });
    }

    return pdf.save();
}
