/**
 * PURE LOGIC: Server-safe and hydration-safe data mocking for Ghost UI.
 * This file MUST NOT contain any React hooks to ensure it can be imported by Server Components.
 */

/**
 * Zorgt voor een 'predictive' lijst van data voor Ghost UI.
 * Als de data nog laadt of ontbreekt, geeft het een array met 'mock' items terug 
 * van de gewenste lengte voor deterministic rendering.
 * 
 * @param data De array met echte data (of undefined)
 * @param isLoading Of de data momenteel aan het laden is
 * @param count Het gewenste aantal items (default 4)
 * @param mockTemplate Optionele extra vulling voor de mock objecten
 * @returns Een array met data of mock-objecten
 */
export function getGhostData<T extends Record<string, any>>(
    data: T[] | undefined, 
    isLoading: boolean, 
    count: number = 4,
    mockTemplate: Partial<T> = {}
): T[] {
    if (isLoading || !data || data.length === 0) {
        // Retourneer een lijst met veilige 'Mock' objecten
        return Array.from({ length: count }, (_, i) => ({
            id: `ghost-${i}`,
            ...mockTemplate
        } as unknown as T));
    }
    
    return data.slice(0, count);
}
