import KroegentochtEventForm from '@/components/islands/admin/kroegentocht/KroegentochtEventForm';
import { getPubCrawlEvent } from '@/server/actions/admin/kroegentocht/admin-kroegentocht-core.actions';
import { notFound, redirect } from 'next/navigation';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';

export const metadata = {
    title: 'Kroegentocht Event Bewerken | Salve Mundi' };

interface EditKroegentochtPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditKroegentochtPage({ params }: EditKroegentochtPageProps) {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');
    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('kroegentocht')) {
        return <AdminUnauthorized title="Event Bewerken" backHref="/beheer/kroegentocht" />;
    }

    const { id } = await params;
    const event = await getPubCrawlEvent(id).catch(() => null);

    if (!event) notFound();

    return (
        <AdminPageShell
            title="Event Bewerken"
            subtitle={`Beheer de gegevens van ${event.name}`}
            backHref="/beheer/kroegentocht"
        >
            <KroegentochtEventForm event={event} />
        </AdminPageShell>
    );
}
