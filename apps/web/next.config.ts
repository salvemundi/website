import type { NextConfig } from 'next';

const getDirectusHostname = () => {
    const url = process.env.NEXT_PUBLIC_DIRECTUS_URL;
    if (!url) return null;
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
};

const directusHostname = getDirectusHostname();

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
                protocol: 'http',
                hostname: 'directus', // Docker internal for SSR
            },
            ...(directusHostname && directusHostname !== 'admin.salvemundi.nl' && directusHostname !== 'directus'
                ? [
                    {
                        protocol: (process.env.NEXT_PUBLIC_DIRECTUS_URL?.split(':')[0] as any) || 'https',
                        hostname: directusHostname,
                    },
                ]
                : []),
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
        NEXT_PUBLIC_ENTRA_CLIENT_ID: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID,
        NEXT_PUBLIC_ENTRA_TENANT_ID: process.env.NEXT_PUBLIC_ENTRA_TENANT_ID,
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

    // Custom headers for security and caching
    async headers() {
        return [
            {
                // Apply security headers to all routes
                source: '/:path*',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
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
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self), payment=()',
                    },

                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://login.microsoftonline.com https://alcdn.msauth.net https://www.googletagmanager.com https://www.google-analytics.com https://*.cloudflare.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https: http:",
                            "media-src 'self' blob: https:",
                            "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://admin.salvemundi.nl https://notifications.salvemundi.nl https://data.imagination.platour.net https://www.google-analytics.com https://analytics.google.com wss: https://*.cartocdn.com",
                            "frame-src 'self' https://login.microsoftonline.com https://www.google.com",
                            "worker-src 'self' blob:",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'self'",
                            "upgrade-insecure-requests",
                        ].join('; '),
                    },
                ],
            },
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
    async redirects() {
        return [
            {
                source: '/declaratie',
                destination: 'https://forms.office.com/pages/responsepage.aspx?id=Xq36stBFtUuuNY90UgS768eTbbHvQi5Br7P2y-SH0OBURUE0R1NLTllNN0FBUDg2N0lJQ1NDVERDMyQlQCN0PWcu&route=shorturl',
                permanent: false,
            },
        ];
    },

    async rewrites() {
        return {
            beforeFiles: [
                // Finance Service (Port 3002) - Keep prefixes
                {
                    source: '/api/payments/:path*',
                    destination: 'http://finance:3002/api/payments/:path*',
                },
                {
                    source: '/api/coupons/:path*',
                    destination: 'http://finance:3002/api/coupons/:path*',
                },
                {
                    source: '/api/admin/:path*',
                    destination: 'http://finance:3002/api/admin/:path*',
                },
                // Email Service (Port 3001) - Strip prefix for API, keep for calendar
                {
                    source: '/api/email/:path*',
                    destination: 'http://email:3001/:path*',
                },
                {
                    source: '/calendar',
                    destination: 'http://email:3001/calendar',
                },
            ],
            afterFiles: [],
            fallback: [],
        };
    },
};

export default nextConfig;
