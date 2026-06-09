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
                src: '/img/icons/icon-48x48.png',
                sizes: '48x48',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-256x256.png',
                sizes: '256x256',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png'
            },
            {
                src: '/img/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            },
            // Nieuwe maskable icons voor betere PWA ondersteuning (o.a. Android)
            {
                src: '/img/icons/manifest-icon-192.maskable.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/img/icons/manifest-icon-192.maskable.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/img/icons/manifest-icon-512.maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/img/icons/manifest-icon-512.maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            }
        ]
    };
}