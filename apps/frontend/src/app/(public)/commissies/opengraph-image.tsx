// OG-image route voor de commissies overzichtspagina (Refactored)
import { ImageResponse } from 'next/og';

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
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#5A3761', // Brand purple frame
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Foreground Card */}
                <div style={{
                    width: '92%',
                    height: '84%',
                    backgroundColor: 'white',
                    borderRadius: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    {/* Top Half - Placeholder for group feeling */}
                    <div style={{
                        height: '50%',
                        width: '100%',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid #f1f3f5',
                    }}>
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#5A3761" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>

                    {/* Bottom Half */}
                    <div style={{
                        height: '50%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 60px',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <p style={{ fontSize: 20, fontWeight: 700, color: '#5A3761', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8 }}>
                                COMMISSIES
                            </p>
                            <h1 style={{ fontSize: 72, fontWeight: 900, color: '#212529', margin: 0 }}>
                                Onze Commissies
                            </h1>
                        </div>

                        {/* Members Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#f8f9fa',
                            padding: '16px 32px',
                            borderRadius: 20,
                            border: '1px solid #f1f3f5',
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A3761" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 12 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            <span style={{ fontSize: 32, fontWeight: 800, color: '#5A3761' }}>{'>'}15 Commissies</span>
                        </div>
                    </div>

                    {/* Mini Logo branding */}
                    <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, backgroundColor: '#5A3761', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>S</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}

