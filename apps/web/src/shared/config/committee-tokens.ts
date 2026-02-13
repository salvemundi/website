export const COMMITTEE_TOKENS = {
    ICT: 'ict',
    BESTUUR: 'bestuur',
    KANDI: 'kandi', // Candidate Board
    KAS: 'kas', // Treasury
    INTRO: 'intro',
    REIS: 'reis',
    ACC: 'acc',
    KAMP: 'kamp',
    FEEST: 'feest',
    MEDIA: 'media',
    MARKETING: 'marketing',
    STUDIE: 'studie',
    SPORT: 'sport',
} as const;

export type CommitteeToken = typeof COMMITTEE_TOKENS[keyof typeof COMMITTEE_TOKENS];
