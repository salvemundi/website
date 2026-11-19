import type { IconName } from '@/lib/utils/icons';

// Centrale routedefinities voor Salve Mundi V7 frontend
export const ROUTES = {
    HOME: '/',
    INTRO: '/intro',
    INTRO_QR_CODE: '/qr-code',
    MEMBERSHIP: '/lidmaatschap',
    ACTIVITIES: '/activiteiten',
    COMMITTEES: '/commissies',
    CLUBS: '/clubs',
    PUB_CRAWL: '/kroegentocht',
    TRIP: '/reis',
    MERCH: '/merch',
    CONTACT: '/contact',
    ACCOUNT: '/profiel',
    STICKERS: '/stickers',
    SAFE_HAVENS: '/safe-havens',
    ADMIN: '/beheer',
    BIJBANENBANK: '/bijbanenbank',
    COBO: '/cobo',
    PIZZA: '/pizza',
    CAMERA: '/camera',
    QR_GENERATOR: '/qr-generator'
} as const;

export const MIN_VISIBLE_NAV_ITEMS = 5;

export interface SiteRoute {
    name: string;
    href: (typeof ROUTES)[keyof typeof ROUTES];
    icon: IconName;
    priority: 1 | 2 | 3;
}

export const SITE_ROUTES: readonly SiteRoute[] = [
    { name: 'Home', href: ROUTES.HOME, icon: 'Home', priority: 1 },
    { name: 'Intro', href: ROUTES.INTRO, icon: 'Sparkles', priority: 3 },
    { name: 'Merch', href: ROUTES.MERCH, icon: 'Shirt', priority: 2 },
    { name: 'Lidmaatschap', href: ROUTES.MEMBERSHIP, icon: 'User', priority: 1 },
    { name: 'Activiteiten', href: ROUTES.ACTIVITIES, icon: 'CalendarDays', priority: 1 },
    { name: 'Commissies', href: ROUTES.COMMITTEES, icon: 'Users', priority: 1 },
    { name: 'Clubs', href: ROUTES.CLUBS, icon: 'Users', priority: 3 },
    { name: 'Kroegentocht', href: ROUTES.PUB_CRAWL, icon: 'Beer', priority: 2 },
    { name: 'CoBo', href: ROUTES.COBO, icon: 'Wine', priority: 3 },
    { name: 'Reis', href: ROUTES.TRIP, icon: 'Map', priority: 1 },
    { name: 'Safe Havens', href: ROUTES.SAFE_HAVENS, icon: 'Shield', priority: 1 },
    { name: 'Stickers', href: ROUTES.STICKERS, icon: 'MapPin', priority: 2 },
    { name: 'Bijbanenbank', href: ROUTES.BIJBANENBANK, icon: 'Briefcase', priority: 3 },
    { name: 'QR-generator', href: ROUTES.QR_GENERATOR, icon: 'QrCode', priority: 3 },
    { name: 'Contact', href: ROUTES.CONTACT, icon: 'Mail', priority: 1 },
];

export function getPublicNavRoutes(disabledRoutes: string[] = []): SiteRoute[] {
    return SITE_ROUTES.filter((route) => !disabledRoutes.includes(route.href));
}

// De routes die zonder inloggen toegankelijk zijn (de (public) groep in src/app)
export const PUBLIC_ROUTES: string[] = [
    ...SITE_ROUTES.map((route) => route.href),
    ROUTES.INTRO_QR_CODE,
    '/kroegentocht-scanner',
    '/api/assets',
    '/api/intro/planning.ics',
    '/api/activiteiten/ics',
    // Eigen toegangscontrole in de route (ticket-cookie, eigenaar of beheerder).
    '/api/kroegentocht/tickets',
    '/map',
    '/404'
];

