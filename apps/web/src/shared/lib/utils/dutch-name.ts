/**
 * Splits a Dutch last name into a prefix (tussenvoegsel) and the actual last name.
 * 
 * Examples:
 * "van der Vries" -> { prefix: "van der", lastName: "Vries" }
 * "De Vries" -> { prefix: "De", lastName: "Vries" }
 * "Jansen" -> { prefix: "", lastName: "Jansen" }
 */
export function splitDutchLastName(fullName: string): { prefix: string; lastName: string } {
    if (!fullName) return { prefix: '', lastName: '' };

    const prefixes = [
        'van dent', 'van der', 'van den', 'van de', 'van het', 'van \'t',
        'op den', 'op der', 'op de', 'op het', 'op \'t',
        'in den', 'in der', 'in de', 'in het', 'in \'t',
        'uit den', 'uit der', 'uit de', 'uit het', 'uit \'t',
        'bij den', 'bij der', 'bij de', 'bij het', 'bij \'t',
        'aan den', 'aan der', 'aan de', 'aan het', 'aan \'t',
        'van', 'de', 'den', 'der', 'het', '\'t', 'ten', 'ter', 'te', 'op', 'in', 'na', 'onder', 'over', 'voor', 'bij', 'aan', 'uit', 'door'
    ];

    const lower = fullName.toLowerCase();

    // Check for multi-word prefixes first (longest match)
    // We sort prefixes by length descending to match "van der" before "van"
    const sortedPrefixes = [...prefixes].sort((a, b) => b.length - a.length);

    for (const prefix of sortedPrefixes) {
        // Check if the name starts with the prefix followed by a space
        if (lower.startsWith(prefix + ' ')) {
            // Use the length of the prefix to extract the original case string
            const prefixPart = fullName.substring(0, prefix.length);
            const rest = fullName.substring(prefix.length + 1).trim();
            return {
                prefix: prefixPart,
                lastName: rest
            };
        }
    }

    return { prefix: '', lastName: fullName };
}
