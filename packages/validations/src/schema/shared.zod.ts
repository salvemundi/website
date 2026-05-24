import { z } from 'zod';

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

export const phoneNumberSchema = z.string()
    .min(8, 'Telefoonnummer moet beginnen met + followed by landcode (bijv. +31612345678)')
    .max(16, 'Telefoonnummer is te lang')
    .regex(/^\+[1-9][0-9\s\-()]+$/, 'Telefoonnummer moet beginnen met + followed by landcode (bijv. +31612345678)');

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const imageUploadSchema = z
    .custom<File | Blob>((val) => val instanceof File || val instanceof Blob, 'Geen geldig bestand geüpload')
    .refine((file) => file.size <= MAX_UPLOAD_SIZE, 'Bestand is te groot. Maximaal 5MB toegestaan.')
    .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
        'Alleen .jpg, .jpeg, .png en .webp bestanden worden geaccepteerd.'
    );