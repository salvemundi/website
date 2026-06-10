import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
    output: 'standalone',
    poweredByHeader: false,
    cacheComponents: false,
    productionBrowserSourceMaps: false,
    serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
    experimental: {
        serverSourceMaps: true,
        optimizePackageImports: ['lucide-react', 'maplibre-gl'],
        serverActions: {
            bodySizeLimit: '50mb'
        }
    },
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
        remotePatterns: [
            ...(process.env.NEXT_PUBLIC_DIRECTUS_URL
                ? [{
                    protocol: (process.env.NEXT_PUBLIC_DIRECTUS_URL.startsWith('https') ? 'https' : 'http') as 'http' | 'https',
                    hostname: new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL).hostname,
                    pathname: '/assets/**',
                }]
                : []
            ),
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/assets/**',
            },
        ],
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
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                ],
            },
        ];
    },
    async redirects() {
        return [
            { source: '/vereniging/commissies/:path*', destination: '/commissies/:path*', permanent: true },
            { source: '/vereniging/:path*', destination: '/commissies/:path*', permanent: true },
            { source: '/beheer/vereniging/:path*', destination: '/beheer/commissies/:path*', permanent: true },
            { source: '/profiel/lidmaatschap/:path*', destination: '/lidmaatschap/:path*', permanent: true },
            { source: '/profiel/lidmaatschap', destination: '/lidmaatschap', permanent: true },
        ];
    },
    transpilePackages: ['better-auth'],
    webpack: (config, { isServer }) => {
        config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
        if (!isServer) { config.resolve.alias['core-js'] = false; }
        return config;
    },
};

const withSerwist = withSerwistInit({
    swSrc: 'src/sw.ts',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV !== 'production',
    exclude: [
        // Exclude source maps
        /\.map$/,
        // Exclude Adobe Illustrator vector files
        /\.ai$/,
        // Exclude all files in public/img/old/
        /\/img\/old\//,
        // Exclude Next.js build manifests
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
