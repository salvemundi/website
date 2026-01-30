import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
    width: 512,
    height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 200,
                    background: 'linear-gradient(135deg, #FF6542 0%, #9B4DCA 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '900',
                    borderRadius: '24%',
                }}
            >
                <div style={{ display: 'flex', fontSize: 180 }}>SM</div>
                <div style={{ fontSize: 40, marginTop: -20, opacity: 0.9, letterSpacing: 4 }}>SALVE MUNDI</div>
            </div>
        ),
        {
            ...size,
        }
    );
}
