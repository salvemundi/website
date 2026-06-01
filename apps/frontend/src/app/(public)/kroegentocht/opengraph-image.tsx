// OG-image route voor de kroegentochtpagina (Refactored)
import { ImageResponse } from 'next/og';
import { getKroegentochtEvent } from '@/server/actions/events/kroegentocht.actions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const event = await getKroegentochtEvent();

    const title = event?.name || 'Kroegentocht';
    const date = event?.date ? new Date(event.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Binnenkort meer info';

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Logo top-left */}
                <div style={{ position: 'absolute', top: 40, left: 60, display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, backgroundColor: '#4a2344', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>S</span>
                        </div>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#4a2344', letterSpacing: -1 }}>SALVE MUNDI</span>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
                    <h1 style={{ fontSize: 120, fontWeight: 900, color: '#4a2344', marginBottom: 40, letterSpacing: -4 }}>
                        {title}
                    </h1>

                    {/* Date Card */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        padding: '24px 40px',
                        borderRadius: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: '1px solid #f1f3f5'
                    }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a2344" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 24 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 36, fontWeight: 800, color: '#4a2344' }}>{date}</span>
                        </div>
                    </div>
                </div>

                {/* Subtle watermark bottom-right */}
                <div style={{ position: 'absolute', bottom: 40, right: 60, opacity: 0.05, display: 'flex' }}>
                    <div style={{ width: 120, height: 120, backgroundColor: '#4a2344', borderRadius: 24 }}></div>
                </div>
            </div>
        ),
        { ...size }
    );
}
