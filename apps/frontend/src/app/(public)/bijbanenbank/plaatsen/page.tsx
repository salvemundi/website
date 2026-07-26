import VacancySubmissionFormIsland from '@/components/islands/vacancies/VacancySubmissionFormIsland';

export const metadata = {
    title: 'Vacature Aanmelden | SV Salve Mundi',
    description: 'Meld een stage of bijbaan aan voor leden van Salve Mundi.'
};

export default function VacancySubmissionPage() {
    return (
        <div className="w-full min-h-dvh pt-8">
            <div className="mx-auto max-w-3xl px-4 py-12">
                <VacancySubmissionFormIsland />
            </div>
        </div>
    );
}
