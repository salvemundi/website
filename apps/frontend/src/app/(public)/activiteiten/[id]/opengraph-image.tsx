// OG-image route voor de activiteit detailpagina
import { ImageResponse } from 'next/og';
import { getActivityBySlug } from '@/server/actions/events/public-activiteit.actions';

// runtime switched to nodejs for database compatibility
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const activity = await getActivityBySlug(id);
    
    const title = activity?.titel || 'Activiteit';
    const desc = activity?.beschrijving || 'Schrijf je in voor deze activiteit bij Salve Mundi.';
    const description = desc.length > 100 ? desc.substring(0, 100) + '...' : desc;

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
                <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>SALVE MUNDI</div>
                </div>

                <p style={{ fontSize: 24, opacity: 0.75, marginBottom: 16, letterSpacing: 4 }}>
                    ACTIVITEIT
                </p>
                <h1 style={{ fontSize: 84, fontWeight: 800, margin: 0, textAlign: 'center', lineHeight: 1.1 }}>
                    {title}
                </h1>
                <p style={{ fontSize: 32, opacity: 0.85, marginTop: 24, textAlign: 'center', maxWidth: 900 }}>
                    {description}
                </p>
                
                <div style={{ position: 'absolute', bottom: 40, display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                    <p style={{ fontSize: 20 }}>salvemundi.nl</p>
                </div>
            </div>
        ),
        { ...size },
    );
}
