// OG-image route voor de commissie detailpagina
import { ImageResponse } from 'next/og';
import { getCommitteeBySlug } from '@/server/actions/public/committees.actions';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const committee = await getCommitteeBySlug(slug);
    
    const title = committee?.naam || 'Commissie';
    const description = committee?.omschrijving?.substring(0, 100) + (committee?.omschrijving?.length > 100 ? '...' : '') || 'Ontdek wat deze commissie doet voor Salve Mundi.';

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
                {/* Logo in de hoek */}
                <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>SALVE MUNDI</div>
                </div>

                <p style={{ fontSize: 24, opacity: 0.75, marginBottom: 16, letterSpacing: 4 }}>
                    COMMISSIE
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
