export interface Country {
    code: string;
    dialCode: string;
    placeholder: string;
}

const COUNTRY_DATA: [string, string, string][] = [
    ['NL', '+31', '6 12345678'],
    ['BE', '+32', '470 12 34 56'],
    ['DE', '+49', '151 12345678'],
    ['GB', '+44', '7911 123456'],
    ['FR', '+33', '6 12 34 56 78'],
    ['ES', '+34', '612 34 56 78'],
    ['IT', '+39', '312 345 6789'],
    ['PL', '+48', '512 345 678'],
    ['US', '+1', '(555) 000-0000'],
    ['AT', '+43', '650 1234567'],
    ['AU', '+61', '412 345 678'],
    ['BG', '+359', '87 123 4567'],
    ['BR', '+55', '11 91234-5678'],
    ['CA', '+1', '(555) 000-0000'],
    ['CH', '+41', '78 123 45 67'],
    ['CN', '+86', '131 2345 6789'],
    ['CY', '+357', '96 123456'],
    ['CZ', '+420', '601 123 456'],
    ['DK', '+45', '20 12 34 56'],
    ['EE', '+372', '5123 4567'],
    ['FI', '+358', '41 2345678'],
    ['GR', '+30', '691 234 5678'],
    ['HR', '+385', '91 234 5678'],
    ['HU', '+36', '20 123 4567'],
    ['IE', '+353', '83 123 4567'],
    ['IN', '+91', '81234 56789'],
    ['IS', '+354', '612 3456'],
    ['JP', '+81', '90 1234 5678'],
    ['LT', '+370', '612 34567'],
    ['LU', '+352', '621 123 456'],
    ['LV', '+371', '21 234 567'],
    ['MA', '+212', '612-345678'],
    ['MX', '+52', '1 55 1234 5678'],
    ['NO', '+47', '412 34 567'],
    ['NZ', '+64', '21 123 4567'],
    ['PT', '+351', '912 345 678'],
    ['RO', '+40', '712 345 678'],
    ['SE', '+46', '70 123 45 67'],
    ['SG', '+65', '8123 4567'],
    ['SI', '+386', '31 234 567'],
    ['SK', '+421', '912 345 678'],
    ['SR', '+597', '712-3456'],
    ['TR', '+90', '501 234 56 78'],
    ['UA', '+380', '50 123 4567'],
    ['ZA', '+27', '71 123 4567'],
];

export const ALL_COUNTRIES: Country[] = COUNTRY_DATA.map(([code, dialCode, placeholder]) => ({
    code,
    dialCode,
    placeholder,
}));

export const DEFAULT_COUNTRY = ALL_COUNTRIES[0];

const nlDisplayNames = new Intl.DisplayNames(['nl'], { type: 'region' });
const enDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function getCountryName(code: string, locale: 'nl' | 'en' = 'nl'): string {
    try {
        const displayNames = locale === 'nl' ? nlDisplayNames : enDisplayNames;
        return displayNames.of(code) || code;
    } catch {
        return code;
    }
}

export function matchesCountrySearch(code: string, query: string): boolean {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const nameNl = getCountryName(code, 'nl').toLowerCase();
    const nameEn = getCountryName(code, 'en').toLowerCase();
    return nameNl.includes(q) || nameEn.includes(q) || code.toLowerCase().includes(q);
}

export function findCountryByDialCode(dialCode: string): Country | undefined {
    return ALL_COUNTRIES.find((c) => c.dialCode === dialCode);
}

export function parsePhoneNumber(raw: string): { country: Country; nationalNumber: string } {
    if (!raw) {
        return { country: DEFAULT_COUNTRY, nationalNumber: '' };
    }

    const trimmed = raw.trim();

    if (trimmed.startsWith('+')) {
        const sorted = [...ALL_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        for (const c of sorted) {
            if (trimmed.startsWith(c.dialCode)) {
                const nationalNumber = trimmed.slice(c.dialCode.length).trim();
                return { country: c, nationalNumber };
            }
        }
    }

    if (trimmed.startsWith('00')) {
        return parsePhoneNumber('+' + trimmed.slice(2));
    }

    let national = trimmed;
    if (national.startsWith('0')) {
        national = national.slice(1);
    }

    return { country: DEFAULT_COUNTRY, nationalNumber: national };
}
