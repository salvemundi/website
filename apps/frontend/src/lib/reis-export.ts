import { format } from 'date-fns';
import type { Trip, TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions } from '@/lib/reis';
import { getPaymentStatus, getStatusBadge } from './reis-admin.utils';

interface ExpandedTripSignupActivity {
    activity_name?: string;
    trip_activity_id?: number | { name?: string; options?: string | unknown[] };
    selected_options?: string | Record<string, unknown>;
    activity_options?: string | unknown[];
}

/**
 * Genereert de data array voor de CSV export van reisaanmeldingen.
 */
export function generateReisCSVData(
    signups: TripSignup[], 
    signupActivitiesMap: Record<number, TripSignupActivity[]>, 
    _trip: Trip
) {
    return signups.map(signup => {
        const idDoc = signup.id_document || '';
        const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

        const activities = signupActivitiesMap[signup.id] || [];
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
            'Geboortedatum': signup.date_of_birth ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy') : '',
            'ID Type': idDocLabel,
            'Document nummer': signup.document_number || '',
            'Allergieën': signup.allergies || '',
            'Bijzonderheden': signup.special_notes || '',
            'Activiteiten': activitiesStr,
            'Wil rijden': signup.willing_to_drive ? 'Ja' : 'Nee',
            'Rol': signup.role === 'crew' ? 'Crew' : 'Reiziger',
            'Status': getStatusBadge(signup.status || 'registered').label,
            'Betalingstatus': getPaymentStatus(signup).label,
            'Aanbetaling betaald op': signup.deposit_paid_at ? format(new Date(signup.deposit_paid_at), 'dd-MM-yyyy HH:mm') : '',
            'Volledige betaling op': signup.full_payment_paid_at ? format(new Date(signup.full_payment_paid_at), 'dd-MM-yyyy HH:mm') : '',
            'Aangemeld op': signup.date_created ? format(new Date(signup.date_created), 'dd-MM-yyyy HH:mm') : ''
        };
    });
}
