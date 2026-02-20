
import { getPaymentPageData } from '@/app/reis/actions';
import { getImageUrl } from '@/shared/lib/api/image';
import ActivitySelectionForm from '@/widgets/reis/ActivitySelectionForm';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { AlertCircle, ArrowLeft, Utensils } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ActiviteitenAanpassenPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { token } = await searchParams;

    const signupId = parseInt(id);

    if (isNaN(signupId)) {
        redirect('/reis');
    }

    const result = await getPaymentPageData(signupId, token);

    if (!result.success || !result.data) {
        return (
            <main className="min-h-screen bg-background">
                <PageHeader
                    title="Activiteiten"
                    backgroundImage="/img/placeholder.svg"
                    variant="centered"
                />
                <div className="flex items-center justify-center px-4 py-12">
                    <div className="text-center max-w-md bg-white dark:bg-[var(--bg-card-dark)] p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Toegang geweigerd</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{result.error || 'Je hebt geen toegang tot deze aanmelding of de aanmelding bestaat niet.'}</p>
                        <Link
                            href="/reis"
                            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            Terug naar reis pagina
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const { signup, trip, activities, selectedActivities: initialSelected, activityOptions: initialOptions } = result.data;

    // Check logical constraints
    if (!signup.deposit_paid) {
        redirect(token ? `/reis/aanbetaling/${signupId}?token=${token}` : `/reis/aanbetaling/${signupId}`);
    }

    const isReadOnly = signup.full_payment_paid;

    return (
        <main className="min-h-screen bg-background pb-12">
            <PageHeader
                title={`Activiteiten - ${trip?.name || 'Reis'}`}
                backgroundImage={trip?.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
                variant="centered"
            />

            <div className="container mx-auto px-4 -mt-8 relative z-10 max-w-4xl">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href={token ? `/reis/restbetaling/${signupId}?token=${token}` : `/reis/restbetaling/${signupId}`}
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full transition-all text-sm font-medium shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Terug naar overzicht
                    </Link>
                </div>

                {isReadOnly ? (
                    <div className="bg-white dark:bg-[var(--bg-card-dark)] border border-blue-200 dark:border-blue-900/30 rounded-2xl p-8 shadow-lg text-center">
                        <Utensils className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Activiteiten staan vast</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto leading-relaxed">
                            Omdat de volledige betaling is voldaan, kunnen de activiteiten niet meer worden gewijzigd via de website.
                            Neem contact op met de reiscommissie als je toch nog iets wilt wijzigen.
                        </p>
                        <Link
                            href={token ? `/reis/restbetaling/${signupId}?token=${token}` : `/reis/restbetaling/${signupId}`}
                            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-600/20"
                        >
                            Terug naar overzicht
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-xl mb-8 shadow-sm">
                            <div className="flex items-start">
                                <Utensils className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-blue-800 dark:text-blue-300 font-bold text-lg mb-1">Activiteiten aanpassen</h3>
                                    <p className="text-blue-700 dark:text-blue-200 text-sm leading-relaxed">
                                        De kosten voor extra activiteiten worden automatisch toegevoegd aan je restbedrag.
                                        Je kunt activiteiten blijven aanpassen tot je de definitieve betaling voldoet.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ActivitySelectionForm
                            signupId={signupId}
                            trip={trip}
                            activities={activities}
                            initialSelectedActivities={initialSelected}
                            initialActivityOptions={initialOptions}
                            token={token}
                        />
                    </>
                )}
            </div>
        </main>
    );
}
