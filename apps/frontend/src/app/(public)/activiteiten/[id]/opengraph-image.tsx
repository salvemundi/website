// OG-image route voor de activiteit detailpagina (Refactored)
import { ImageResponse } from 'next/og';
import { getActivityBySlug } from '@/server/actions/events/public-activiteit.actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const activity = await getActivityBySlug(id);
    
    const title = activity?.titel || 'Activiteit';
    const description = activity?.beschrijving || 'Schrijf je in voor deze activiteit bij Salve Mundi.';
    const price = activity?.price_non_members !== undefined ? `€${activity.price_non_members}` : 'Gratis';
    
    const dateStr = activity?.datum_start ? new Date(activity.datum_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : 'Binnenkort';
    const timeStr = activity?.datum_start ? new Date(activity.datum_start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '';

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
                    padding: '60px 80px',
                    width: '60%',
                    position: 'relative',
                }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#4a2344', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16 }}>
                        ACTIVITEIT
                    </p>
                    <h1 style={{ fontSize: 84, fontWeight: 900, color: '#212529', marginBottom: 32, lineHeight: 1.1, letterSpacing: -2 }}>
                        {title}
                    </h1>
                    
                    {/* Metadata Row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '12px 24px', borderRadius: 100, border: '1px solid #f1f3f5' }}>
                            <span style={{ fontSize: 24, marginRight: 12 }}>📅</span>
                            <span style={{ fontSize: 22, fontWeight: 700, color: '#4a2344' }}>{dateStr} {timeStr}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '12px 24px', borderRadius: 100, border: '1px solid #f1f3f5' }}>
                            <span style={{ fontSize: 24, marginRight: 12 }}>🏷️</span>
                            <span style={{ fontSize: 22, fontWeight: 700, color: '#4a2344' }}>{price}</span>
                        </div>
                    </div>

                    <p style={{ fontSize: 28, color: '#495057', lineHeight: 1.5, maxWidth: 600 }}>
                        {description.length > 140 ? description.substring(0, 140) + '...' : description}
                    </p>
                    
                    {/* Logo bottom-left */}
                    <div style={{ position: 'absolute', bottom: 40, left: 80, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, backgroundColor: '#4a2344', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>S</span>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#4a2344', letterSpacing: -1 }}>SALVE MUNDI</span>
                    </div>
                </div>

                {/* Right Column (40%) */}
                <div style={{
                    width: '40%',
                    height: '100%',
                    display: 'flex',
                    padding: '40px 40px 40px 0',
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f1f3f5',
                        borderRadius: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                         <div style={{ fontSize: 140 }}>🎉</div>
                         
                         {/* Accent blob */}
                         <div style={{
                             position: 'absolute',
                             top: -100,
                             right: -100,
                             width: 300,
                             height: 300,
                             backgroundColor: '#4a2344',
                             opacity: 0.03,
                             borderRadius: 1000,
                         }}></div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
