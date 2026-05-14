import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { downloadCSV } from '@/lib/utils/export';
import { type Signup } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import { getSignupName, getSignupEmail, getSignupPhone } from './activity-signup.utils';

/**
 * Maps signup data to CSV format and triggers download.
 */
export function exportSignupsToCSV(signups: Signup[], eventName: string) {
    if (signups.length === 0) return;

    const data = signups.map(signup => ({
        Naam: getSignupName(signup),
        Email: getSignupEmail(signup),
        Telefoon: getSignupPhone(signup),
        Status: signup.payment_status || 'open',
        'Checked In': signup.checked_in ? 'Ja' : 'Nee',
        'Inschrijfdatum': signup.created_at ? format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm', { locale: nl }) : 'Onbekend'
    }));

    const sanitizedEventName = (eventName || 'Activiteit').replace(/[^a-z0-9]/gi, '_');
    const fileName = `Aanmeldingen_${sanitizedEventName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    downloadCSV(data, fileName);
}
