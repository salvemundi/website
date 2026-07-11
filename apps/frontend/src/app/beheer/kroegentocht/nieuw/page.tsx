import KroegentochtEventForm from '@/components/islands/admin/kroegentocht/KroegentochtEventForm';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata = {
    title: 'Nieuw Kroegentocht Event | Salve Mundi'
};

export default async function NewKroegentochtPage() {
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
