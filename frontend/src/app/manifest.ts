import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    let name = 'Salve Mundi';
    let shortName = 'Salve Mundi';

    const siteTag = process.env.NEXT_PUBLIC_SITE_TAG;
    if (siteTag === 'dev' || siteTag === 'local') {
        name = 'SaMu Dev';
        shortName = 'SaMu Dev';
    }

    return {
        name: name,
        short_name: shortName,
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ff6542',
        icons: [
            {
                src: '/logo_purple.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable'
            },
            {
                src: '/logo_purple.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any'
            },
            {
                src: '/logo_purple.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any'
            },
        ],
        orientation: 'portrait',
        shortcuts: [
            {
                name: 'Activiteiten',
                short_name: 'Activiteiten',
                description: 'Bekijk onze activiteiten',
                url: '/activiteiten',
                icons: [{ src: '/logo_purple.svg', sizes: '192x192', type: 'image/svg+xml' }]
            },
            {
                name: 'Account',
                short_name: 'Account',
                description: 'Mijn account instellingen',
                url: '/account',
                icons: [{ src: '/logo_purple.svg', sizes: '192x192', type: 'image/svg+xml' }]
            }
        ]
    };
}
