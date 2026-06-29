import { slugify } from './slug';

export function getActivityUrl(activity: { name: string; custom_url?: string | null }): string {
    if (activity.custom_url && activity.custom_url.startsWith('/')) {
        return activity.custom_url;
    }
    return `/activiteiten/${slugify(activity.name || '')}`;
}
