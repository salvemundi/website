import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    // Vereist voor de 'use cache' directive conform V7 PPR-strategie
    cacheComponents: true,
};

export default nextConfig;
