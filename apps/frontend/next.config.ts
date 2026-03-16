import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    // Uitgeschakeld vanwege instabiliteit op Acceptance (Eternal Skeletons)
    // cacheComponents: true,
    experimental: {
        ppr: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '100.77.182.130',
                port: '',
                pathname: '/assets/**',
            },
            {
                protocol: 'http',
                hostname: '100.77.182.130',
                port: '8055',
                pathname: '/assets/**',
            },
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
};

export default nextConfig;
