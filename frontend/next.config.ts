/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode
    reactStrictMode: true,

    // Enable standalone output for Docker
    output: 'standalone',

    // Configure image domains for Next.js Image optimization
    images: {
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
    },

    // Enable experimental features for App Router
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // Environment variables that should be available client-side
    env: {
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },

    // Webpack configuration for compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webpack: (config: any) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },

    // Disable x-powered-by header
    poweredByHeader: false,

    // Configure rewrites for API proxy (development & production)
    async rewrites() {
        // Hardcoded as requested to ensure connection to production backend
        const DIRECTUS_URL = 'https://admin.salvemundi.nl';
        const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

        console.log('📍 Proxying /api requests to:', DIRECTUS_URL);
        console.log('📍 Proxying /api/admin and /api/payments to:', PAYMENT_API_URL);

        return [
            // Payment API endpoints - must come FIRST to match before catch-all
            {
                source: '/api/admin/:path*',
                destination: `${PAYMENT_API_URL}/api/admin/:path*`,
            },
            {
                source: '/api/payments/:path*',
                destination: `${PAYMENT_API_URL}/api/payments/:path*`,
            },
            // Directus endpoints - catch-all for everything else
            {
                source: '/api/:path*',
                destination: `${DIRECTUS_URL}/:path*`,
            },
        ];
    },
};

export default nextConfig;
