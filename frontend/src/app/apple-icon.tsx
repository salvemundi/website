import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
    width: 180,
    height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #FF6542 0%, #9B4DCA 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* No text, just the brand gradient */}
            </div>
        ),
        {
            ...size,
        }
    );
}
