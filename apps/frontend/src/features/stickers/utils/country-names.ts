const COUNTRY_ALIASES: Record<string, string> = {
    'the netherlands': 'Nederland',
    'netherlands': 'Nederland',
    'holland': 'Nederland',
    'nederland': 'Nederland',
    'belgie': 'België',
    'belgium': 'België',
    'uk': 'Verenigd Koninkrijk',
    'united kingdom': 'Verenigd Koninkrijk',
    'great britain': 'Verenigd Koninkrijk',
    'usa': 'Verenigde Staten',
    'us': 'Verenigde Staten',
    'united states': 'Verenigde Staten',
    'united states of america': 'Verenigde Staten',
    'czech republic': 'Tsjechië',
    'czechia': 'Tsjechië',
    'bosnia and herzegovina': 'Bosnië en Herzegovina',
    'north macedonia': 'Noord-Macedonië',
    'south korea': 'Zuid-Korea',
    'north korea': 'Noord-Korea',
    'uae': 'Verenigde Arabische Emiraten',
};

let englishToDutchMap: Map<string, string> | null = null;

function getEnglishToDutchMap(): Map<string, string> {
    if (englishToDutchMap) return englishToDutchMap;

    const map = new Map<string, string>();
    for (const [alias, dutch] of Object.entries(COUNTRY_ALIASES)) {
        map.set(alias, dutch);
    }

    try {
        const enNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const nlNames = new Intl.DisplayNames(['nl'], { type: 'region' });

        for (let i = 65; i <= 90; i++) {
            for (let j = 65; j <= 90; j++) {
                const code = String.fromCharCode(i, j);
                const en = enNames.of(code);
                const nl = nlNames.of(code);
                if (en && nl && en !== code && nl !== code) {
                    map.set(en.toLowerCase(), nl);
                    map.set(nl.toLowerCase(), nl);
                    map.set(code.toLowerCase(), nl);
                }
            }
        }
    } catch {
        // Fallback to alias map when Intl.DisplayNames is unavailable
    }

    englishToDutchMap = map;
    return map;
}

export function normalizeCountryNameToDutch(country: string | null | undefined): string {
    const trimmed = country?.trim();
    if (!trimmed) return '';

    const lookup = getEnglishToDutchMap();
    return lookup.get(trimmed.toLowerCase()) ?? trimmed;
}
