// Directus Assets via interne proxy om Public permissie restricties te omzeilen
export function getImageUrl(id?: string | null): string {
    if (!id) return '/img/placeholder.svg';
    return `/api/assets/${id}`;
}
