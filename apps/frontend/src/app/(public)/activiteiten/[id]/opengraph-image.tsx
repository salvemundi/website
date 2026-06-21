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
    
    // We only display the short_description (TL;DR) on the OG image preview, avoiding the long announcement text
    const description = activity?.short_description || '';

    // Format the price nicely
    const priceVal = activity?.price_non_members;
    const priceMem = activity?.price_members;
    let price = 'Gratis';
    if (priceVal !== null && priceVal !== undefined && Number(priceVal) > 0) {
        if (priceMem !== null && priceMem !== undefined && Number(priceMem) > 0 && priceMem !== priceVal) {
            price = `v.a. €${priceMem}`;
        } else {
            price = `€${priceVal}`;
        }
    } else if (priceMem !== null && priceMem !== undefined && Number(priceMem) > 0) {
        price = `v.a. €${priceMem}`;
    }

    const dateStr = activity?.datum_start ? new Date(activity.datum_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : 'Binnenkort';
    const timeStr = activity?.datum_start ? new Date(activity.datum_start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '';

    // Handle banner image
    const imageId = typeof activity?.afbeelding_id === 'string'
        ? activity.afbeelding_id
        : activity?.afbeelding_id?.id;

    const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.INTERNAL_DIRECTUS_URL;
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    const imageUrl = imageId && directusUrl && token
        ? `${directusUrl.replace(/\/$/, '')}/assets/${imageId}?access_token=${token}`
        : null;

    const showRightColumn = !!imageUrl;

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
                {/* Left Column (60% or 100%) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '60px 80px',
                    width: showRightColumn ? '60%' : '100%',
                    position: 'relative',
                }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#5A3761', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16 }}>
                        Activiteit
                    </p>
                    <h1 style={{ fontSize: 84, fontWeight: 900, color: '#212529', marginBottom: 32, lineHeight: 1.1, letterSpacing: -2 }}>
                        {title}
                    </h1>

                    {/* Metadata Row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '12px 24px', borderRadius: 100, border: '1px solid #f1f3f5' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5A3761" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 12 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span style={{ fontSize: 22, fontWeight: 700, color: '#5A3761' }}>{dateStr} {timeStr}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '12px 24px', borderRadius: 100, border: '1px solid #f1f3f5' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5A3761" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 12 }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                            <span style={{ fontSize: 22, fontWeight: 700, color: '#5A3761' }}>{price}</span>
                        </div>
                    </div>

                    {description ? (
                        <p style={{ fontSize: 28, color: '#495057', lineHeight: 1.5, maxWidth: 600, whiteSpace: 'pre-wrap', marginBottom: 32 }}>
                            {description.length > 180 ? description.substring(0, 180) + '...' : description}
                        </p>
                    ) : null}

                    {/* Logo bottom-left */}
                    <div style={{ position: 'absolute', bottom: 40, left: 80, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, backgroundColor: '#5A3761', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>S</span>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#5A3761', letterSpacing: -1 }}>SALVE MUNDI</span>
                    </div>
                </div>

                {/* Right Column (40%) */}
                {showRightColumn && (
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        ),
        { ...size }
    );
}
