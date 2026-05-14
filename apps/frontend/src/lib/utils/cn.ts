import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * De 'Industrial-Grade' class merger.
 * Combineert clsx voor conditionele logica en tailwind-merge voor conflict-resolutie.
 * Dit is de 'final glue' voor de Ghost UI architectuur.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
