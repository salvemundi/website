import { getVacancies } from '@/server/actions/vacancies/vacancies-public.actions';
import BijbanenbankIsland from '@/components/islands/vacancies/BijbanenbankIsland';
import BackButton from '@/components/ui/navigation/BackButton';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Bijbanenbank | SV Salve Mundi',
    description: 'Bekijk stages en bijbanen die door bedrijven zijn aangeboden aan leden van Salve Mundi.'
};

export default async function BijbanenbankPage() {
    const vacancies = await getVacancies();

    return (
        <div className="pt-8">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <BackButton href="/profiel" />
                </div>

                <div className="mb-8">
                    <h1 className="form-title">Bijbanenbank</h1>
                    <p className="text-(--text-muted) mt-2 max-w-2xl">
                        Stages en bijbanen aangeboden door bedrijven aan leden van Salve Mundi.
                    </p>
                </div>

                <BijbanenbankIsland vacancies={vacancies} />
            </div>
        </div>
    );
}
