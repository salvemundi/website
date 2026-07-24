import AdminVacanciesIsland from '@/components/islands/admin/vacancies/AdminVacanciesIsland';
import { getAdminVacancies, getPendingSubmissions } from '@/server/actions/vacancies/vacancies-admin.actions';

export const dynamic = 'force-dynamic';

export default async function BijbanenbankAdminPage() {
    const [vacancies, submissions] = await Promise.all([
        getAdminVacancies(),
        getPendingSubmissions()
    ]);

    const vacancyRows = vacancies.map((v) => ({
        id: v.id,
        title: v.title,
        company: v.company,
        type: v.type,
        is_visible: v.is_visible,
        published_at: v.published_at
    }));

    return (
        <div className="pb-20">
            <AdminVacanciesIsland vacancies={vacancyRows} submissions={submissions} />
        </div>
    );
}
