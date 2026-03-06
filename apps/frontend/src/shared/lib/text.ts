// MISSING SOURCE REQUIREMENT: Stubbed to satisfy compiler
export function stripHtml(html: string): string {
    return html ? html.replace(/<[^>]*>?/gm, '') : '';
}
