import { downloadCSV } from '@/lib/utils/export';
import { type Signup } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import { getSignupName, getSignupEmail, getSignupPhone } from './activity-signup.utils';

export function exportSignupsToCSV(signups: Signup[], eventName: string) {
    if (signups.length === 0) return;

    const data = signups.map(signup => {
        const createdAt = signup.created_at ? new Date(signup.created_at) : null;
        const formattedDate = createdAt && !isNaN(createdAt.getTime())
            ? `${createdAt.getDate().toString().padStart(2, '0')}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${createdAt.getFullYear()} ${createdAt.getHours().toString().padStart(2, '0')}:${createdAt.getMinutes().toString().padStart(2, '0')}`
            : 'Onbekend';

        return {
            Naam: getSignupName(signup),
            Email: getSignupEmail(signup),
            Telefoon: getSignupPhone(signup),
            Status: signup.payment_status || 'open',
            'Checked In': signup.checked_in ? 'Ja' : 'Nee',
            'Inschrijfdatum': formattedDate
        };
    });

    const sanitizedEventName = (eventName || 'Activiteit').replace(/[^a-z0-9]/gi, '_');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const fileName = `Aanmeldingen_${sanitizedEventName}_${dateStr}.csv`;

    downloadCSV(data, fileName);
}