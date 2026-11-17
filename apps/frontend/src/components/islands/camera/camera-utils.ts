import type { CameraRequestStatus } from '@salvemundi/validations';

export const STATUS_LABEL: Record<CameraRequestStatus, string> = {
    requested: 'Aangevraagd',
    approved: 'Goedgekeurd',
    rejected: 'Afgewezen',
    cancelled: 'Geannuleerd',
};

export const STATUS_CLASS: Record<CameraRequestStatus, string> = {
    requested: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    approved: 'border-green-200 bg-green-100 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    rejected: 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    cancelled: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
};

export const badgeBase =
    'inline-flex rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase shadow-sm';
