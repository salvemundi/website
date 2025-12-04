import { ImageResponse } from 'next/og';

export const OG_IMAGE_SIZE = {
    width: 1200,
    height: 630,
};

export const BRAND_COLORS = {
    oranje: '#ff6542',
    paars: '#6366f1',
    background: '#0a0a0a',
    white: '#ffffff',
};

export const GRADIENTS = {
    main: `linear-gradient(135deg, ${BRAND_COLORS.oranje} 0%, ${BRAND_COLORS.paars} 100%)`,
    subtle: `linear-gradient(135deg, ${BRAND_COLORS.oranje}20 0%, ${BRAND_COLORS.paars}20 100%)`,
};

interface OGImageProps {
    title: string;
    description?: string;
    category?: string;
}

export async function generateOGImage(props: OGImageProps) {
    const { title, description, category } = props;

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    backgroundColor: BRAND_COLORS.background,
                    padding: '80px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background gradient overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: GRADIENTS.subtle,
                        opacity: 0.3,
                    }}
                />

                {/* Decorative gradient circle */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-200px',
                        right: '-200px',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        background: GRADIENTS.main,
                        opacity: 0.15,
                        filter: 'blur(100px)',
                    }}
                />

                {/* Top section with category */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {category && (
                        <div
                            style={{
                                fontSize: '28px',
                                fontWeight: 600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                background: GRADIENTS.main,
                                backgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            {category}
                        </div>
                    )}

                    <div
                        style={{
                            fontSize: '72px',
                            fontWeight: 900,
                            lineHeight: 1.1,
                            color: BRAND_COLORS.white,
                            maxWidth: '900px',
                            display: 'flex',
                        }}
                    >
                        {title}
                    </div>

                    {description && (
                        <div
                            style={{
                                fontSize: '32px',
                                fontWeight: 400,
                                lineHeight: 1.4,
                                color: '#a0a0a0',
                                maxWidth: '800px',
                                display: 'flex',
                            }}
                        >
                            {description}
                        </div>
                    )}
                </div>

                {/* Bottom section with branding */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {/* Logo placeholder - using gradient circle */}
                    <div
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: GRADIENTS.main,
                            display: 'flex',
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '32px',
                                fontWeight: 700,
                                color: BRAND_COLORS.white,
                            }}
                        >
                            Salve Mundi
                        </div>
                        <div
                            style={{
                                fontSize: '20px',
                                fontWeight: 400,
                                color: '#888888',
                            }}
                        >
                            Studievereniging Fontys ICT Eindhoven
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...OG_IMAGE_SIZE,
        }
    );
}
