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
        return [
            {
                source: '/api/:path*',
                destination: 'https://admin.salvemundi.nl/:path*',
            },
        ];
    },
};

export default nextConfig;
