// Centrale routedefinities voor Salve Mundi V7 frontend
export const ROUTES = {
    HOME: '/',
    INTRO: '/intro',
    MEMBERSHIP: '/lidmaatschap',
    ACTIVITIES: '/activiteiten',
    COMMITTEES: '/commissies',
    PUB_CRAWL: '/kroegentocht',
    TRIP: '/reis',
    WEBSHOP: '/webshop',
    CONTACT: '/contact',
    ACCOUNT: '/profiel',
    STICKERS: '/stickers',
    SAFE_HAVENS: '/safe-havens',
    ADMIN: '/beheer',
    BIJBANENBANK: '/bijbanenbank'
} as const;

// De routes die zonder inloggen toegankelijk zijn (de (public) groep in src/app)
export const PUBLIC_ROUTES: string[] = [
    ROUTES.HOME,
    ROUTES.CONTACT,
    ROUTES.STICKERS,
    ROUTES.SAFE_HAVENS,
    ROUTES.MEMBERSHIP,
    ROUTES.COMMITTEES,
    ROUTES.ACTIVITIES,
    ROUTES.PUB_CRAWL,
    ROUTES.INTRO,
    ROUTES.TRIP,
    ROUTES.WEBSHOP,
    '/commissies/oud-besturen',
    '/api/assets',
    '/map',
    '/404'
];

