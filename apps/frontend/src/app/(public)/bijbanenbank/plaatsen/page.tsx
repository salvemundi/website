import { Container } from '@mantine/core';
import VacancySubmissionFormIsland from '@/components/islands/vacancies/VacancySubmissionFormIsland';

export const metadata = {
    title: 'Vacature Aanmelden | SV Salve Mundi',
    description: 'Meld een stage of bijbaan aan voor leden van Salve Mundi.'
};

export default function VacancySubmissionPage() {
    return (
        <Container size="md" py="xl">
            <VacancySubmissionFormIsland />
        </Container>
    );
}
