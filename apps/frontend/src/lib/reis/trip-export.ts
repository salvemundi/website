import { type Trip, type TripSignup, type TripSignupActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions } from '@/lib/reis';
import { getPaymentStatus, getStatusBadge } from './trip-admin.utils';
import { safeConsoleError } from '@/server/utils/logger';

interface ExpandedTripSignupActivity {
    activity_name?: string;
    trip_activity_id?: number | { name?: string; options?: string | unknown[] };
    selected_options?: string | { [key: string]: unknown };
    activity_options?: string | unknown[];
}

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

        const activities = (signupActivitiesMap[signup.id] as TripSignupActivity[] | undefined) || [];
        const activitiesStr = activities.map(a => {
            const activity = a as unknown as ExpandedTripSignupActivity;
            const tripActIdObj = typeof activity.trip_activity_id === 'object' ? activity.trip_activity_id : null;
            const name = activity.activity_name || tripActIdObj?.name || String(activity.trip_activity_id);

            const rawOptions = parseSelectedOptions(typeof activity.selected_options === 'string' ? activity.selected_options : JSON.stringify(activity.selected_options || {}));
            const metaOptions = parseActivityOptions(typeof activity.activity_options === 'string' ? activity.activity_options : (typeof tripActIdObj?.options === 'string' ? tripActIdObj.options : JSON.stringify(tripActIdObj?.options || [])));

            const opts = Object.keys(rawOptions);
            const optNames = opts.map(id => mapActivityOptionIdToName(id, metaOptions)).filter(Boolean);

            return optNames.length > 0 ? `${name} (${optNames.join(', ')})` : name;
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
            'Rol': signup.role === 'crew' ? 'Crew' : 'Reiziger',
            'Status': getStatusBadge(signup.status || 'registered').label,
            'Betalingstatus': getPaymentStatus(signup).label,
            'Aanbetaling betaald op': formatCSVDate(signup.deposit_paid_at, true),
            'Volledige betaling op': formatCSVDate(signup.full_payment_paid_at, true),
            'Aangemeld op': formatCSVDate(signup.created_at, true)
        };
    });
}