import { getVacancies } from '@/server/actions/vacancies/vacancies-public.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import BijbanenbankIsland from '@/components/islands/vacancies/BijbanenbankIsland';
import BackButton from '@/components/ui/navigation/BackButton';
import type { VacancyDTO } from '@salvemundi/validations';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Bijbanenbank | SV Salve Mundi',
    description: 'Bekijk stages en bijbanen die door bedrijven zijn aangeboden aan leden van Salve Mundi.'
};

// Anonymous visitors only get the title/image/type — everything else requires a login.
function redactForAnonymous(vacancies: VacancyDTO[]): VacancyDTO[] {
    return vacancies.map((vacancy) => ({
        ...vacancy,
        company: '',
        description: '',
        contact_email: '',
        contact_phone: null,
        contact_website: null,
        location: '',
        salary: null,
        employment_type: null,
        working_hours: null,
        directions: [],
        skills: [],
        document: null
    }));
}

export default async function BijbanenbankPage() {
    const [vacancies, session] = await Promise.all([
        getVacancies(),
        getEnrichedSession()
    ]);
    const isLoggedIn = !!session?.user;
    const visibleVacancies = isLoggedIn ? vacancies : redactForAnonymous(vacancies);

    return (
        <div className="pt-8">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <BackButton href={isLoggedIn ? '/profiel' : '/'} />
                </div>

                <div className="mb-8">
                    <h1 className="form-title">Bijbanenbank</h1>
                    <p className="text-(--text-muted) mt-2 max-w-2xl">
                        Stages en bijbanen aangeboden door bedrijven aan leden van Salve Mundi.
                    </p>
                </div>

                <BijbanenbankIsland vacancies={visibleVacancies} isLoggedIn={isLoggedIn} />
            </div>
        </div>
    );
}
