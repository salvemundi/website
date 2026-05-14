// OG-image route voor de Oud-Besturen pagina
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Oud-Besturen - Salve Mundi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #5e2b52 0%, #a4539b 100%)',
                    color: '#ffffff',
                    fontFamily: 'sans-serif',
                    padding: '60px' }}
            >
                <p style={{ fontSize: 24, opacity: 0.75, marginBottom: 16, letterSpacing: 4 }}>
                    OUD-BESTUREN
                </p>
                <h1 style={{ fontSize: 72, fontWeight: 800, margin: 0, textAlign: 'center' }}>
                    Oud-Besturen
                </h1>
                <p style={{ fontSize: 28, opacity: 0.85, marginTop: 24, textAlign: 'center', maxWidth: 800 }}>
                    Een overzicht van alle voorgaande besturen die hun steentje hebben bijgedragen aan Salve Mundi.
                </p>
                <p style={{ fontSize: 20, opacity: 0.6, marginTop: 48 }}>
                    Salve Mundi — Studievereniging ICT
                </p>
            </div>
        ),
        { ...size },
    );
}
