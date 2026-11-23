// OG-image route voor de activiteiten overzichtspagina (Refactored)
import { ImageResponse } from 'next/og';
import { BRAND_COLORS } from '@/lib/config/theme';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    backgroundColor: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Left Column (60%) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '80px',
                    width: '60%',
                    position: 'relative',
                }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: BRAND_COLORS.purple, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 20 }}>
                        ACTIVITEITEN
                    </p>
                    <h1 style={{ fontSize: 84, fontWeight: 900, color: BRAND_COLORS.darkBase, marginBottom: 40, lineHeight: 1.1 }}>
                        Onze Activiteiten
                    </h1>
                    <p style={{ fontSize: 32, color: BRAND_COLORS.darkSurface, lineHeight: 1.5, maxWidth: 600 }}>
                        Bekijk de aankomende evenementen, feesten en studiegerelateerde activiteiten van Salve Mundi.
                    </p>
                    
                    {/* Logo bottom-left */}
                    <div style={{ position: 'absolute', bottom: 40, left: 80, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, backgroundColor: BRAND_COLORS.purple, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>S</span>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, color: BRAND_COLORS.purple, letterSpacing: -1 }}>SALVE MUNDI</span>
                    </div>
                </div>

                {/* Right Column (40%) - Placeholder for Hero aesthetic */}
                <div style={{
                    width: '40%',
                    height: '100%',
                    display: 'flex',
                    padding: '40px 40px 40px 0',
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: BRAND_COLORS.lightBase,
                        borderRadius: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${BRAND_COLORS.lightBase}`,
                        overflow: 'hidden',
                    }}>
                         <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={BRAND_COLORS.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}

