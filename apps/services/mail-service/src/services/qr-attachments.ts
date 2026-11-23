export interface GraphInlineAttachment {
    '@odata.type': '#microsoft.graph.fileAttachment';
    name: string;
    contentType: 'image/png';
    contentBytes: string;
    contentId: string;
    isInline: true;
}

export interface PreparedEmailQrAssets {
    renderData: Record<string, unknown>;
    attachments: GraphInlineAttachment[];
}

export type QrPngFetcher = (token: string, size?: number) => Promise<Buffer>;

const DATA_URL_PREFIX = 'data:image/png;base64,';

function makeAttachment(contentId: string, pngBuffer: Buffer): GraphInlineAttachment {
    return {
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: `${contentId}.png`,
        contentType: 'image/png',
        contentBytes: pngBuffer.toString('base64'),
        contentId,
        isInline: true,
    };
}

function readToken(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export async function fetchQrPngFromFrontend(token: string, size = 440): Promise<Buffer> {
    const baseUrl = (process.env.NEXT_APP_INTERNAL_URL || '').trim().replace(/\/+$/, '');
    const serviceToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
    if (!baseUrl || !serviceToken) {
        throw new Error('NEXT_APP_INTERNAL_URL or INTERNAL_SERVICE_TOKEN is missing for QR rendering');
    }

    const response = await fetch(`${baseUrl}/api/internal/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceToken}` },
        body: JSON.stringify({ value: token, size }),
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Frontend QR endpoint returned ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}

export async function prepareEmailQrAssets(
    templateId: string,
    data: Record<string, unknown>,
    fetchPng: QrPngFetcher = fetchQrPngFromFrontend,
): Promise<PreparedEmailQrAssets> {
    const renderData: Record<string, unknown> = { ...data };
    const attachments: GraphInlineAttachment[] = [];

    if (templateId === 'pub_crawl_ticket' && Array.isArray(data.tickets)) {
        renderData.tickets = await Promise.all(
            data.tickets.map(async (ticket, index) => {
                if (typeof ticket !== 'object' || ticket === null || Array.isArray(ticket)) return ticket;
                const rec = ticket as Record<string, unknown>;
                const cid = `qr-ticket-${index}`;
                const token = readToken(rec.qrToken) || readToken(rec.qr_token);
                if (token) {
                    attachments.push(makeAttachment(cid, await fetchPng(token, 440)));
                    return { ...rec, qrCid: cid };
                }
                const legacy = readToken(rec.qrDataUrl);
                if (legacy.startsWith(DATA_URL_PREFIX)) {
                    attachments.push(makeAttachment(cid, Buffer.from(legacy.slice(DATA_URL_PREFIX.length), 'base64')));
                    return { ...rec, qrCid: cid };
                }
                return ticket;
            }),
        );
        return { renderData, attachments };
    }

    if (templateId === 'event-ticket' || templateId === 'payment_confirmed') {
        const token = readToken(data.qrToken);
        if (token) {
            const cid = 'ticket-qr';
            attachments.push(makeAttachment(cid, await fetchPng(token, 440)));
            renderData.qrCid = cid;
        }
    }

    return { renderData, attachments };
}
