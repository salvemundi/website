// OG-image route voor de commissie detailpagina (Refactored)
import { ImageResponse } from 'next/og';
import { getCommitteeBySlug } from '@/server/actions/public/committees.actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const committee = await getCommitteeBySlug(slug);
    
    const title = committee?.name || 'Commissie';
    const description = committee?.description || 'Ontdek wat deze commissie doet voor Salve Mundi.';

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4a2344', // Brand purple frame
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Foreground Card */}
                <div style={{
                    width: '94%',
                    height: '88%',
                    backgroundColor: 'white',
                    borderRadius: 40,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                }}>
                    {/* Top Half - Image Placeholder with accent overlay */}
                    <div style={{
                        height: '55%',
                        width: '100%',
                        backgroundColor: '#f1f3f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}>
                        {/* Dynamic Image or Icon */}
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#4a2344" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        
                        {/* Soft overlay gradient */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            background: 'linear-gradient(to bottom, transparent, white)',
                        }}></div>
                    </div>

                    {/* Bottom Half */}
                    <div style={{
                        height: '45%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '20px 60px 40px 60px',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                            <p style={{ fontSize: 22, fontWeight: 700, color: '#4a2344', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 12 }}>
                                COMMISSIE
                            </p>
                            <h1 style={{ fontSize: 84, fontWeight: 900, color: '#212529', margin: 0, lineHeight: 1.0 }}>
                                {title}
                            </h1>
                            <p style={{ fontSize: 24, color: '#495057', marginTop: 16, lineHeight: 1.4, display: 'flex' }}>
                                {description.length > 120 ? description.substring(0, 120) + '...' : description}
                            </p>
                        </div>

                        {/* Social Proof / Badge */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            marginTop: 20,
                        }}>
                             <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#f8f9fa',
                                padding: '14px 24px',
                                borderRadius: 16,
                                border: '1px solid #e9ecef',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a2344" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                <span style={{ fontSize: 24, fontWeight: 800, color: '#4a2344' }}>Actieve Leden</span>
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, backgroundColor: '#4a2344', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>S</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
