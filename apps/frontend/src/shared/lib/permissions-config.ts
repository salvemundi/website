
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
    Permissions = 'admin:permissions',
    Users = 'admin:users',
    Kroegentocht = 'admin:kroegentocht'
}

export interface PermissionRequirement {
    allowedCommitteeIds: string[];
    leaderOnly?: boolean;
}

/**
 * Committee UUIDs from Directus.
 */
export const COMMITTEES = {
    ICT: process.env.NEXT_PUBLIC_COMMITTEE_ICT_ID || 'a4aeb401-882d-4e1e-90ee-106b7fdb23cc',
    BESTUUR: process.env.NEXT_PUBLIC_COMMITTEE_BESTUUR_ID || 'b16d93c7-42ef-412e-afb3-f6cbe487d0e0',
    KAMP: process.env.NEXT_PUBLIC_COMMITTEE_KAMP_ID || 'b907ae11-2067-49ac-b8a7-0ce166eabbcb',
    KAS: process.env.NEXT_PUBLIC_COMMITTEE_KAS_ID || '8d6c181e-3527-4a0b-aacb-5f758b4d14f5',
    MEDIA: process.env.NEXT_PUBLIC_COMMITTEE_MEDIA_ID || '3ec890d7-93b7-416d-8470-c2cb8cbad8ba',
    FEEST: process.env.NEXT_PUBLIC_COMMITTEE_FEEST_ID || '0ac8627d-07f8-43fd-a629-808572e95098',
    STUDY: process.env.NEXT_PUBLIC_COMMITTEE_STUDY_ID || 'ee4c4407-6d61-483e-a98c-77c5e20bd7ba',
    INTRO: process.env.NEXT_PUBLIC_COMMITTEE_INTRO_ID || '516f03f9-be0a-4514-9da8-396415f59d0b',
    MARKETING: process.env.NEXT_PUBLIC_COMMITTEE_MARKETING_ID || '0140644c-be1e-438f-9db1-9c082283abf2',
    ACTIVITEIT: process.env.NEXT_PUBLIC_COMMITTEE_ACTIVITEIT_ID || 'd4686b83-4679-46ed-9fd8-c6ff3c6a265f',
    REIS: process.env.NEXT_PUBLIC_COMMITTEE_REIS_ID || '4c027a6d-0307-4aee-b719-23d67bcd0959',
    KANDI: process.env.NEXT_PUBLIC_COMMITTEE_KANDI_ID || '00000000-0000-0000-0000-000000000000',
};

export const RESOURCE_PERMISSIONS: Record<AdminResource, PermissionRequirement> = {
    [AdminResource.Intro]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR, COMMITTEES.KANDI, COMMITTEES.INTRO] 
    },
    [AdminResource.Reis]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR, COMMITTEES.REIS, COMMITTEES.KANDI] 
    },
    [AdminResource.Committees]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR] 
    },
    [AdminResource.Coupons]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR] 
    },
    [AdminResource.Stickers]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR] 
    },
    [AdminResource.Logging]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR],
        leaderOnly: true 
    },
    [AdminResource.Sync]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR] 
    },
    [AdminResource.Permissions]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR] 
    },
    [AdminResource.Users]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR] 
    },
    [AdminResource.Kroegentocht]: { 
        allowedCommitteeIds: [COMMITTEES.ICT, COMMITTEES.BESTUUR, COMMITTEES.FEEST] 
    },
};
