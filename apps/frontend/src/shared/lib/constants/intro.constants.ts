export type IntroBlogType = 'update' | 'pictures' | 'event' | 'announcement';

export interface IntroBlogTypeConfig {
    label: string;
    color: string;
    badgeClass: string;
}

export const INTRO_BLOG_TYPES: Record<IntroBlogType, IntroBlogTypeConfig> = {
    update: {
        label: 'Update',
        color: 'blue',
        badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    pictures: {
        label: "Foto's",
        color: 'pink',
        badgeClass: 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    },
    event: {
        label: 'Evenement',
        color: 'amber',
        badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    announcement: {
        label: 'Aankondiging',
        color: 'emerald',
        badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
} as const;

export const INTRO_BLOG_TYPE_OPTIONS: { value: IntroBlogType; label: string }[] = [
    { value: 'update', label: 'Update' },
    { value: 'pictures', label: "Foto's" },
    { value: 'event', label: 'Evenement' },
    { value: 'announcement', label: 'Aankondiging' }
];
