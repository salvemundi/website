import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Salve Mundi',
        short_name: 'Salve Mundi',
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ff6542',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/logo_purple.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable'
            },
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
        orientation: 'portrait',
        shortcuts: [
            {
                name: 'Activiteiten',
                url: '/activiteiten',
                icons: [{ src: '/icon.png', sizes: '192x192' }]
            },
            {
                name: 'Mijn Account',
                url: '/account',
                icons: [{ src: '/icon.png', sizes: '192x192' }]
            }
        ]
    };
}
