
/**
 * Resource-based permission mapping using Directus Committee UUIDs.
 * This is the single source of truth for administrative access.
 */

export enum AdminResource {
    Intro = 'admin:intro',
    Reis = 'admin:reis',
    Committees = 'admin:committees',
    Coupons = 'admin:coupons',
    Stickers = 'admin:stickers',
    Logging = 'admin:logging',
    Sync = 'admin:sync',
    Users = 'admin:users',
    Kroegentocht = 'admin:kroegentocht',
    ActivitiesView = 'admin:activities:view',
    ActivitiesEdit = 'admin:activities:edit',
    Webshop = 'admin:webshop'
}

export interface PermissionRequirement {
    allowedCommitteeIds: string[];
    leaderOnly?: boolean;
}

/**
 * Committee UUIDs from Azure.
 */
export const COMMITTEES = {
    ICT: 'a4aeb401-882d-4e1e-90ee-106b7fdb23cc',
    BESTUUR: 'b16d93c7-42ef-412e-afb3-f6cbe487d0e0',
    KAMP: 'b907ae11-2067-49ac-b8a7-0ce166eabbcb',
    KAS: '8d6c181e-3527-4a0b-aacb-5f758b4d14f5',
    MEDIA: '3ec890d7-93b7-416d-8470-c2cb8cbad8ba',
    FEEST: '0ac8627d-07f8-43fd-a629-808572e95098',
    STUDY: 'ee4c4407-6d61-483e-a98c-77c5e20bd7ba',
    INTRO: '516f03f9-be0a-4514-9da8-396415f59d0b',
    MARKETING: '0140644c-be1e-438f-9db1-9c082283abf2',
    ACTIVITEITEN: 'd4686b83-4679-46ed-9fd8-c6ff3c6a265f',
    REIS: '4c027a6d-0307-4aee-b719-23d67bcd0959',
    KANDI: 'adf4d258-a404-4bc0-ae73-6bfa429a1537'
};

export interface FeatureRegistry {
    activiteiten: readonly string[];
    commissies: readonly string[];
    coupons: readonly string[];
    impersonate: readonly string[];
    intro: readonly string[];
    kroegentocht: readonly string[];
    leden: readonly string[];
    logging: readonly string[];
    reis: readonly string[];
    services: readonly string[];
    stickers: readonly string[];
    sync: readonly string[];
    webshop: readonly string[];
}

export const FEATURE_ACCESS: FeatureRegistry = {
    // Content group dashboard.
    activiteiten: [COMMITTEES.KAMP, COMMITTEES.FEEST, COMMITTEES.STUDY, COMMITTEES.ACTIVITEITEN],
    intro: [COMMITTEES.INTRO],
    kroegentocht: [COMMITTEES.FEEST],
    reis: [COMMITTEES.REIS],
    // Beheer group dashboard.
    webshop: [COMMITTEES.BESTUUR, COMMITTEES.KANDI],
    commissies: [COMMITTEES.BESTUUR, COMMITTEES.KANDI],
    coupons: [COMMITTEES.BESTUUR, COMMITTEES.KANDI],
    leden: [COMMITTEES.BESTUUR, COMMITTEES.KANDI],
    stickers: [COMMITTEES.BESTUUR, COMMITTEES.KANDI],
    // system group dashboard.  
    impersonate: [],
    logging: [],
    services: [],
    sync: [],
} as const;

export type AdminFeature = keyof FeatureRegistry;