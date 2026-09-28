import KroegentochtEventForm from '@/components/islands/beheer/kroegentocht/KroegentochtEventForm';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';

export const metadata = {
    title: 'Nieuw Kroegentocht Event | Salve Mundi'
};

export default async function NewKroegentochtPage() {
    return (
        <BeheerPageShell
            title="Nieuw Event"
            subtitle="Maak een nieuwe kroegentocht aan"
            backHref="/beheer/kroegentocht"
        >
            <KroegentochtEventForm />
        </BeheerPageShell>
    );
}
