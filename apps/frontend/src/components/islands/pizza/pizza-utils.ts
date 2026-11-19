export const formatEuro = (amount: number): string =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

export const STATUS_LABEL: Record<string, string> = {
    open: 'Open',
    closed: 'Gesloten',
    paid: 'Betaald',
};
