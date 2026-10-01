import type { Trip, TripSignup, TripSignupActivity } from '@salvemundi/validations';
import { parseSelectedOptions } from '@/lib/reis';
import { getPaymentStatus, getStatusBadge } from './trip-admin.utils';
import { safeConsoleError } from '@/server/utils/logger';

const formatCSVDate = (dateInput: string | Date | null | undefined, includeTime: boolean = false) => {
    if (!dateInput) return '';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';

        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return new Intl.DateTimeFormat('nl-NL', options).format(d);
    } catch (error) {
        safeConsoleError('[trip-export.ts][formatCSVDate] ', error);
        return '';
    }
};

export function generateReisCSVData(
    signups: TripSignup[],
    signupActivitiesMap: Record<number, TripSignupActivity[]>,
    _trip: Trip
) {
    return signups.map(signup => {
        const idDoc = signup.id_document || '';
        const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

        const activities = signupActivitiesMap[signup.id] ?? [];
        const activitiesStr = activities.map(a => {
            const rawOptions = parseSelectedOptions(typeof a.selected_options === 'string' ? a.selected_options : JSON.stringify(a.selected_options || {}));
            const name = String(a.trip_activity_id || '');
            const opts = Object.keys(rawOptions);
            return opts.length > 0 ? `${name} (${opts.join(', ')})` : name;
        }).join(' | ');

        return {
            'Voornaam': signup.first_name,
            'Achternaam': signup.last_name,
            'Volledige naam': `${signup.first_name} ${signup.last_name}`.trim(),
            'E-mailadres': signup.email,
            'Telefoonnummer': signup.phone_number,
            'Geboortedatum': formatCSVDate(signup.date_of_birth, false),
            'ID Type': idDocLabel,
            'Document nummer': signup.document_number || '',
            'Allergieën': signup.allergies || '',
            'Bijzonderheden': signup.special_notes || '',
            'Activiteiten': activitiesStr,
            'Wil rijden': signup.willing_to_drive ? 'Ja' : 'Nee',
            'Rol': signup.role === 'crew' ? 'Crew' : 'Deelnemer',
            'Status': getStatusBadge(signup.status).label,
            'Betalingstatus': getPaymentStatus(signup).label,
            'Aanbetaling betaald op': formatCSVDate(signup.deposit_paid_at, true),
            'Volledige betaling op': formatCSVDate(signup.full_payment_paid_at, true),
            'Aangemeld op': formatCSVDate(signup.created_at, true)
        };
    });
}