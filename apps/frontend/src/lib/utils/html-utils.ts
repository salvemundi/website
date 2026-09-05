const NAMED_ENTITIES: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    eacute: 'é',
    egrave: 'è',
    ouml: 'ö',
    uuml: 'ü',
    auml: 'ä',
    ndash: '–',
    mdash: '—',
};

function decodeEntities(text: string): string {
    return text
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

/**
 * Legacy club/committee descriptions were imported from a WYSIWYG editor and contain
 * raw HTML (paragraphs, line breaks, occasional leftover layout markup). No HTML
 * sanitizer is set up in this app, so strip tags down to plain text for display.
 */
export function stripHtmlToText(html: string): string {
    const withBreaks = html.replace(/<\/p>|<br\s*\/?>/gi, '\n');
    const withoutTags = withBreaks.replace(/<[^>]*>/g, ' ');
    const decoded = decodeEntities(withoutTags);

    return decoded
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
}
