// Small helper to determine if a nav link should be considered "active" for the current pathname
export function isPathActive(pathname: string, href: string, exact = false): boolean {
    if (!pathname) return false;

    // Normalize
    const normalize = (p: string) => (p === '/' ? '/' : p.replace(/\/+$/, ''));
    const np = normalize(pathname);
    const nh = normalize(href);

    if (exact) return np === nh;

    if (nh === '/') return np === '/';

    // Active when pathname equals href or starts with href + '/'
    return np === nh || np.startsWith(nh + '/');
}

export default isPathActive;
