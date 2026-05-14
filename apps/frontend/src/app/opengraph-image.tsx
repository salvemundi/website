// OG-image route voor de homepage
import { ImageResponse } from 'next/og';

// runtime switched to nodejs for database compatibility
export const alt = 'Salve Mundi - Studievereniging ICT';
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
                    padding: '60px',
                    position: 'relative' }}
            >
                {/* Salve Mundi Branding */}
                <div style={{ position: 'absolute', top: 60, left: 60, display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 4 }}>SALVE MUNDI</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                     <p style={{ fontSize: 24, opacity: 0.8, marginBottom: 16, letterSpacing: 8, fontWeight: 600 }}>
                        STUDIEVERENIGING ICT
                    </p>
                    <h1 style={{ fontSize: 96, fontWeight: 900, margin: 0, textAlign: 'center', lineHeight: 1.0, maxWidth: 1000 }}>
                        Salve Mundi Eindhoven
                    </h1>
                </div>

                <p style={{ fontSize: 36, opacity: 0.9, marginTop: 40, textAlign: 'center', maxWidth: 900, fontWeight: 500 }}>
                    De gezelligste community van Fontys ICT. Ontdek activiteiten, commissies en word lid!
                </p>

                <div style={{ position: 'absolute', bottom: 60, display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                    <p style={{ fontSize: 24 }}>salvemundi.nl</p>
                </div>
            </div>
        ),
        { ...size },
    );
}
