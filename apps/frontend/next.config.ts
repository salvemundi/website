import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = '1';

const nextConfig: NextConfig = {
    serverExternalPackages: ['sharp'],
    experimental: {
        serverSourceMaps: true,
        optimizePackageImports: ['lucide-react', 'maplibre-gl', '@mantine/core', '@mantine/dates', '@mantine/hooks', '@mantine/notifications'],
        serverActions: {
            bodySizeLimit: '20mb'
        },
        // The proxy layer (src/proxy.ts) buffers request bodies before they reach
        // server actions; without raising this too, uploads above its own default
        // cap get silently truncated, which server actions then see as a corrupt
        // multipart body ("Unexpected end of form") even though bodySizeLimit above
        // is high enough. Both need to allow at least image (5MB) + document (10MB).
        proxyClientMaxBodySize: '20mb'
    },
    devIndicators: false,
    output: 'standalone',
    poweredByHeader: false,
    cacheComponents: false,
    productionBrowserSourceMaps: false,
    turbopack: {},
    staticPageGenerationTimeout: 60,
    logging: false,
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        qualities: [75, 80, 90, 100],
        localPatterns: [
            { pathname: '/api/assets/**' },
            { pathname: '/img/**' },
        ],
    },
    async redirects() {
        return [
            {
                source: '/intro/qr-code',
                destination: '/qr-code',
                permanent: true,
            },
            {
                source: '/:path(declaratie|declareren)',
                destination: 'https://forms.cloud.microsoft/r/kN2T95wzRm',
                permanent: false,
            },
        ];
    },

    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                ],
            },
            {
                source: '/manifest.webmanifest',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                ],
            },
            {
                source: '/img/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, must-revalidate' }],
            },
        ];
    },
};

const withSerwist = withSerwistInit({
    swSrc: 'src/sw.ts',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV !== 'production',
    exclude: [
        /\.map$/,
        /react-loadable-manifest\.json$/,
        /build-manifest\.json$/,
        /middleware-manifest\.json$/,
    ],
});

const withAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false
});

export default withAnalyzer(withSerwist(nextConfig));