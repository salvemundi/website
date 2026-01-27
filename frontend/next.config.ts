import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Enable React strict mode
    reactStrictMode: true,

    // Enable standalone output for Docker
    output: 'standalone',

    // Enable compression for better performance on slow connections
    compress: true,

    // Configure image domains for Next.js Image optimization
    images: {
        // Enable modern image formats
        formats: ['image/webp', 'image/avif'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'admin.salvemundi.nl',
            },
            {
                protocol: 'https',
                hostname: 'data.imagination.platour.net',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
        // Allow local /api/assets paths (for Directus access tokens)
        // Do not restrict `search` so query strings like access_token are accepted
        localPatterns: [
            {
                pathname: '/api/assets/**',
            },
            {
                pathname: '/img/**',
            },
        ],
    },

    // Enable experimental features for App Router
    experimental: {
        // Optimize imports for common packages
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
        ],
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // Compiler optimizations
    compiler: {
        // Temporarily disable to see debug logs in production/dev environments
        removeConsole: false,
    },

    // Environment variables that should be available client-side
    env: {
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },

    // Webpack configuration for compatibility
    webpack: (config: any) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },

    // Turbopack configuration (Next.js 16+)
    turbopack: {},

    // Disable x-powered-by header
    poweredByHeader: false,

    // IMPORTANT: Rewrites removed. 
    // All /api/admin, /api/payments, and /api/coupons are now handled via file-based routes
    // to allow for better debugging, logging, and consistency across environments.
    // Catches for Directus should also be handled via src/app/api/[...path]/route.ts

    // Custom headers for Stale-While-Revalidate caching
    async headers() {
        return [
            {
                // Static images: 1h cache, 24h stale-while-revalidate
                source: '/:path*.(jpg|jpeg|png|gif|webp|avif|svg|ico)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600, stale-while-revalidate=86400',
                    },
                ],
            },

            {
                // Next.js optimized images: 1h cache, 24h stale-while-revalidate
                source: '/_next/image/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600, stale-while-revalidate=86400',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
