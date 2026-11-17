export interface CameraPeriod {
    start_date: string;
    start_time: string | null;
    end_date: string;
    end_time: string | null;
}

export const hhmm = (t: string | null): string | null => (t ? t.slice(0, 5) : null);

/** Zonder tijd geldt de hele dag: begin om 00:00, einde om 23:59. */
export const periodStartKey = (p: Pick<CameraPeriod, 'start_date' | 'start_time'>) =>
    `${p.start_date}T${hhmm(p.start_time) ?? '00:00'}`;
export const periodEndKey = (p: Pick<CameraPeriod, 'end_date' | 'end_time'>) =>
    `${p.end_date}T${hhmm(p.end_time) ?? '23:59'}`;

export function periodsOverlap(a: CameraPeriod, b: CameraPeriod): boolean {
    return periodStartKey(a) < periodEndKey(b) && periodStartKey(b) < periodEndKey(a);
}
