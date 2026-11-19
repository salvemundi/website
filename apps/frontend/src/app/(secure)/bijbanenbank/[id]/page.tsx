import { notFound } from 'next/navigation';
import { Container } from '@mantine/core';
import { getVacancyById } from '@/server/actions/vacancies/vacancies-public.actions';
import VacancyDetailIsland from '@/components/islands/vacancies/VacancyDetailIsland';

export const dynamic = 'force-dynamic';

interface VacancyDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VacancyDetailPageProps) {
    const { id } = await params;
    const vacancy = await getVacancyById(Number(id));
    if (!vacancy) return { title: 'Vacature | SV Salve Mundi' };
    return {
        title: `${vacancy.title} bij ${vacancy.company} | Bijbanenbank | SV Salve Mundi`,
        description: vacancy.description.slice(0, 160)
    };
}

export default async function VacancyDetailPage({ params }: VacancyDetailPageProps) {
    const { id } = await params;
    const vacancyId = Number(id);
    if (!Number.isInteger(vacancyId)) notFound();

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) notFound();

    return (
        <Container size="xl" py="xl">
            <VacancyDetailIsland vacancy={vacancy} />
        </Container>
    );
}
