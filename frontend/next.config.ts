import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* ─── Performance ────────────────────────────────────────── */
    reactStrictMode: true,
    poweredByHeader: false,

    /* ─── Image Optimization ─────────────────────────────────── */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.salvemundi.nl",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8055",
            },
        ],
        formats: ["image/avif", "image/webp"],
    },

    /* ─── Server External Packages ───────────────────────────── */
    serverExternalPackages: [],

    /* ─── Experimental ───────────────────────────────────────── */
    experimental: {
        typedRoutes: true,
    },
};

export default nextConfig;
