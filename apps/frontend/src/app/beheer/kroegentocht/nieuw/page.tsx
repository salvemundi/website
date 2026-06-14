import EventForm from '@/components/islands/admin/kroegentocht/EventForm';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata = {
    title: 'Nieuw Kroegentocht Event | Salve Mundi'
};

export default function NewKroegentochtPage() {
    return (
        <AdminPageShell
            title="Nieuw Event"
            subtitle="Maak een nieuwe kroegentocht aan"
            backHref="/beheer/kroegentocht"
        >
            <EventForm />
        </AdminPageShell>
    );
}
