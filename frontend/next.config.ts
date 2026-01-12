/** @type {import('next').NextConfig} */

// Try to enable bundle analyzer when ANALYZE env is true. If the
// package isn't installed, fall back to the plain config so the
// dev server can run without the optional dependency.
let withBundleAnalyzer: any = (config: any) => config;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const _analyzer = require('@next/bundle-analyzer');
    withBundleAnalyzer = _analyzer({ enabled: process.env.ANALYZE === 'true' });
} catch (err) {
    // Package not installed — continue without analyzer.
    // This keeps local development working when the optional
    // dependency is absent.
}

const nextConfig = {
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
        // Remove console.log in production
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
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

    // Turbopack configuration (Next.js 16+)
    // Empty config acknowledges webpack config above
    turbopack: {},

    // Disable x-powered-by header
    poweredByHeader: false,

    // Configure rewrites for API proxy (development & production)
    async rewrites() {
        // Hardcoded as requested to ensure connection to production backend
        const DIRECTUS_URL = 'https://admin.salvemundi.nl';
        const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

        console.log('📍 Proxying /api requests to:', DIRECTUS_URL);
        console.log('📍 Proxying /api/admin and /api/payments directly via rewrites to:', PAYMENT_API_URL);
        console.log('📍 NOTE: /api/coupons is now handled via file-based API route for better debugging');

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

module.exports = withBundleAnalyzer(nextConfig);
