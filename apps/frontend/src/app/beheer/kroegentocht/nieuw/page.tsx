import KroegentochtEventForm from '@/components/islands/admin/kroegentocht/KroegentochtEventForm';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Nieuw Kroegentocht Event | Salve Mundi'
};

export default async function NewKroegentochtPage() {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');
    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('kroegentocht')) {
        return <AdminUnauthorized title="Nieuw Event" backHref="/beheer/kroegentocht" />;
    }

    return (
        <AdminPageShell
            title="Nieuw Event"
            subtitle="Maak een nieuwe kroegentocht aan"
            backHref="/beheer/kroegentocht"
        >
            <KroegentochtEventForm />
        </AdminPageShell>
    );
}
