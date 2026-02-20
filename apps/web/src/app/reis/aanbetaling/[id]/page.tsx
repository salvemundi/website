import { redirect } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getPaymentPageData } from '@/app/reis/actions';
import { getImageUrl } from '@/shared/lib/api/image';
import DepositPaymentForm from '@/widgets/reis/DepositPaymentForm';
import { AlertCircle } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string; status?: string }>;
}

export default async function AanbetalingPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { token, status } = await searchParams;
    const signupId = parseInt(id);

    if (isNaN(signupId)) {
        redirect('/reis');
    }

    const { success, data, error } = await getPaymentPageData(signupId, token);

    if (!success || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-[var(--bg-soft-dark)] dark:to-[var(--bg-main-dark)] px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {error || 'Er is een fout opgetreden'}
                    </h1>
                    <p className="text-gray-600 dark:text-[var(--text-muted-dark)] mb-6">
                        Kon de gegevens niet laden. Probeer het later opnieuw.
                    </p>
                    <a
                        href="/reis"
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        Terug naar reis pagina
                    </a>
                </div>
            </div>
        );
    }

    const { signup, trip, activities, selectedActivities, activityOptions } = data;

    // If deposit is already paid, redirect.
    if (signup.deposit_paid && status !== 'success') {
        redirect('/reis');
    }

    return (
        <main>
            <PageHeader
                title={`Aanbetaling - ${trip?.name || 'Reis'}`}
                backgroundImage={trip?.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />
            <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
                <DepositPaymentForm
                    signup={signup}
                    trip={trip}
                    activities={activities}
                    initialSelectedActivities={selectedActivities}
                    initialActivityOptions={activityOptions}
                    token={token}
                />
            </div>
        </main>
    );
}
