import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const size = {
    width: 180,
    height: 180,
};
export const contentType = 'image/png';

// Image generation for Apple devices
export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 100,
                    background: 'linear-gradient(135deg, #FF6542 0%, #9B4DCA 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                }}
            >
                SM
            </div>
        ),
        {
            ...size,
        }
    );
}
