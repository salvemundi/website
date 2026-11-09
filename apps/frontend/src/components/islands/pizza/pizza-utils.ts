export const formatEuro = (amount: number): string =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

export const STATUS_LABEL: Record<string, string> = {
    open: 'Open',
    closed: 'Gesloten',
    paid: 'Betaald',
};

export const STATUS_CLASS: Record<string, string> = {
    open: 'border-green-200 bg-green-100 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    closed: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    paid: 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
};

export const badgeBase =
    'inline-flex rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase shadow-sm';
