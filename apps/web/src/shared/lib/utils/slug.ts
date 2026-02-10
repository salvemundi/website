export function slugify(input: string): string {
    if (!input) return '';
    // Remove both "|| SALVE MUNDI" and " - Salve Mundi" suffixes
    const cleaned = input.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
    // Normalize diacritics, remove non-alphanum (except spaces and hyphens), convert spaces to hyphens
    return cleaned
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
}
