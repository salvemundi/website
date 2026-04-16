import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const nextConfig: NextConfig = {
    output: 'standalone',
    // Uitgeschakeld vanwege instabiliteit op Acceptance (Eternal Skeletons)
    // cacheComponents: true,
    productionBrowserSourceMaps: false,
    serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
    experimental: {
        ppr: false,
        serverSourceMaps: true,
        webpackBuildWorker: true,
        workerThreads: true,
        optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion']
    },
    staticPageGenerationTimeout: 60,
    logging: false,
    images: {
        localPatterns: [
            {
                pathname: '/api/assets/**',
            },
            {
                pathname: '/img/**',
            },
        ],
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
    async redirects() {
        return [
            {
                source: '/vereniging/commissies/:path*',
                destination: '/commissies/:path*',
                permanent: true,
            },
            {
                source: '/vereniging/:path*',
                destination: '/commissies/:path*',
                permanent: true,
            },
            {
                source: '/beheer/vereniging/:path*',
                destination: '/beheer/commissies/:path*',
                permanent: true,
            },
            {
                source: '/reis/aanbetaling/:id',
                destination: '/reis/betalen/aanbetaling?id=:id',
                permanent: false,
            },
            {
                source: '/reis/restbetaling/:id',
                destination: '/reis/betalen/restbetaling?id=:id',
                permanent: false,
            },
        ];
    },
    transpilePackages: ['better-auth'],
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false
        };
        return config;
    },
};

const withSerwist = withSerwistInit({
    swSrc: 'src/sw.ts',
    swDest: 'public/sw.js',
});

// export default nextConfig;
export default withSerwist(nextConfig);
