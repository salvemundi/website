import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SV Salve Mundi',
        short_name: 'Salve Mundi',
        description: 'De officiële website van SV Salve Mundi, de studievereniging voor Fontys ICT Eindhoven.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a141b',
        theme_color: '#a4539b',
        icons: [
            {
                src: '/img/newlogo.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any' },
            {
                src: '/img/Logo_Rect.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable' },
            {
                src: '/img/Logo_Rect.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable' },
        ] };
}
