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
                src: '/img/Logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/img/Logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/img/Logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
        ],
        orientation: 'portrait',
        shortcuts: [
            {
                name: 'Activiteiten',
                url: '/activiteiten',
                icons: [{ src: '/img/Logo.png', sizes: '192x192' }]
            },
            {
                name: 'Mijn Account',
                url: '/account',
                icons: [{ src: '/img/Logo.png', sizes: '192x192' }]
            }
        ]
    };
}
