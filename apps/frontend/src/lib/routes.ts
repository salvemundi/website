// Centrale routedefinities voor Salve Mundi V7 frontend
export const ROUTES = {
    HOME: '/',
    INTRO: '/intro',
    MEMBERSHIP: '/lidmaatschap',
    ACTIVITIES: '/activiteiten',
    COMMITTEES: '/vereniging',
    PUB_CRAWL: '/kroegentocht',
    TRIP: '/reis',
    CONTACT: '/contact',
    ACCOUNT: '/profiel',
    STICKERS: '/stickers',
    ADMIN: '/beheer',
} as const;

// De routes die zonder inloggen toegankelijk zijn (de (public) groep in src/app)
export const PUBLIC_ROUTES: string[] = [
    ROUTES.HOME,
    ROUTES.CONTACT,
    ROUTES.STICKERS,
    ROUTES.MEMBERSHIP,
    ROUTES.COMMITTEES,
    ROUTES.ACTIVITIES,
    ROUTES.PUB_CRAWL,
    ROUTES.INTRO,
    ROUTES.TRIP,
    '/vereniging/oud-besturen', // Sub-routes ook hier of via prefix-check in proxy
    '/404'
];

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
