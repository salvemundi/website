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
                    fontSize: 80,
                    background: 'linear-gradient(135deg, #FF6542 0%, #9B4DCA 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '900',
                }}
            >
                <div style={{ display: 'flex' }}>SM</div>
                <div style={{ fontSize: 16, marginTop: -5, opacity: 0.9, letterSpacing: 2 }}>SALVE MUNDI</div>
            </div>
        ),
        {
            ...size,
        }
    );
}
