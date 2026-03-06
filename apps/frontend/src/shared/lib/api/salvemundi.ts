// MISSING SOURCE REQUIREMENT: Stubbed to satisfy compiler
export function getImageUrl(id?: string): string {
    if (!id) return '/img/placeholder.svg';
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.salvemundi.nl'}/assets/${id}`;
}
