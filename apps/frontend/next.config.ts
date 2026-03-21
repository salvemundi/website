import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    // Uitgeschakeld vanwege instabiliteit op Acceptance (Eternal Skeletons)
    // cacheComponents: true,
    productionBrowserSourceMaps: true,
    experimental: {
        ppr: false,
        serverSourceMaps: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'admin.salvemundi.nl',
                pathname: '/assets/**',
            },
            {
                protocol: 'https',
                hostname: 'acc.salvemundi.nl',
                pathname: '/assets/**',
            },
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
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://admin.salvemundi.nl https://acc.salvemundi.nl https://salvemundi.nl; font-src 'self'; connect-src 'self' https://admin.salvemundi.nl https://acc.salvemundi.nl https://login.microsoftonline.com; frame-src 'self' https://login.microsoftonline.com; object-src 'none'; base-uri 'self';"
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
