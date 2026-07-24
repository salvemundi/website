import { notFound } from 'next/navigation';
import VacancyAdminFormIsland from '@/components/islands/admin/vacancies/VacancyAdminFormIsland';
import { getAdminVacancyById } from '@/server/actions/vacancies/vacancies-admin.actions';

interface EditVacancyPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditVacancyPage({ params }: EditVacancyPageProps) {
    const { id } = await params;
    const vacancyId = Number(id);
    if (!Number.isInteger(vacancyId)) notFound();

    const vacancy = await getAdminVacancyById(vacancyId);
    if (!vacancy) notFound();

    return <VacancyAdminFormIsland vacancyId={vacancyId} initialData={vacancy} />;
}
