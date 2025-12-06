import { ImageResponse } from 'next/og';
import { OG_IMAGE_SIZE, BRAND_COLORS, GRADIENTS } from './og-utils';

interface EventOGImageProps {
    title: string;
    date: string;
    price?: string;
    imageUrl?: string;
    committeeName?: string;
}

export async function generateEventOGImage(props: EventOGImageProps) {
    const { title, date, price, imageUrl, committeeName } = props;

    // Format the date
    const eventDate = new Date(date);
    const formattedDate = eventDate.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    backgroundColor: BRAND_COLORS.background,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Image Section (Left 60%) */}
                {imageUrl && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '60%',
                            display: 'flex',
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                        {/* Dark gradient overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to right, rgba(10, 10, 10, 0.3), rgba(10, 10, 10, 0.9))',
                            }}
                        />
                    </div>
                )}

                {/* Content Section (Right 40% + overlap) */}
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: imageUrl ? '50%' : '100%',
                        background: BRAND_COLORS.background,
                        padding: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                >
                    {/* Top section with event details */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px',
                        }}
                    >
                        {/* Category badge */}
                        {committeeName && (
                            <div
                                style={{
                                    fontSize: '20px',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    background: GRADIENTS.main,
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                    display: 'flex',
                                }}
                            >
                                {committeeName}
                            </div>
                        )}

                        {/* Event Title */}
                        <div
                            style={{
                                fontSize: '56px',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                color: BRAND_COLORS.white,
                                display: 'flex',
                                flexWrap: 'wrap',
                            }}
                        >
                            {title}
                        </div>

                        {/* Date & Time */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '24px',
                                        display: 'flex',
                                    }}
                                >
                                    📅
                                </div>
                                <div
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: 600,
                                        color: '#e0e0e0',
                                        display: 'flex',
                                    }}
                                >
                                    {formattedDate}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '24px',
                                        display: 'flex',
                                    }}
                                >
                                    🕐
                                </div>
                                <div
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: 600,
                                        color: '#e0e0e0',
                                        display: 'flex',
                                    }}
                                >
                                    {formattedTime}
                                </div>
                            </div>
                            {price && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '24px',
                                            display: 'flex',
                                        }}
                                    >
                                        💰
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: 600,
                                            color: '#e0e0e0',
                                            display: 'flex',
                                        }}
                                    >
                                        {price}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom section with branding */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                        }}
                    >
                        {/* Logo placeholder - using gradient circle */}
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: GRADIENTS.main,
                                display: 'flex',
                            }}
                        />

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: BRAND_COLORS.white,
                                }}
                            >
                                Salve Mundi
                            </div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    color: '#888888',
                                }}
                            >
                                Studievereniging Fontys ICT
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative gradient circle */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: GRADIENTS.main,
                        opacity: 0.1,
                        filter: 'blur(80px)',
                    }}
                />
            </div>
        ),
        {
            ...OG_IMAGE_SIZE,
        }
    );
}
