import { z } from 'zod';

/**
 * SALVE MUNDI - Shared Validation Schemas
 * 
 * Standardized validators for common fields like Date of Birth and Phone Numbers.
 */

/**
 * Validates a date of birth in YYYY-MM-DD format.
 * - Must be a valid date.
 * - Must not be in the future.
 * - Must not be older than 100 years.
 */
export const dateOfBirthSchema = z.string()
    .min(1, 'Geboortedatum is verplicht')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
    .refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, 'Ongeldige datum')
    .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        return date <= today;
    }, 'Ongeldige datum')
    .refine((val) => {
        const date = new Date(val);
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
        return date >= hundredYearsAgo;
    }, 'Geboortedatum kan niet meer dan 100 jaar geleden zijn.');

/**
 * Validates a phone number.
 * Relaxed requirement: Just minimum 10 characters (updated per user feedback to be more flexible).
 */
export const phoneNumberSchema = z.string()
    .min(10, 'Ongeldig telefoonnummer');
