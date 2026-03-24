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
    logging: {
        fetches: {
            fullUrl: false,
        },
    },
    images: {
        remotePatterns: [
            ...(process.env.NEXT_PUBLIC_DIRECTUS_URL 
                ? [{
                    protocol: new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL).protocol.replace(':', '') as 'http' | 'https',
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
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
