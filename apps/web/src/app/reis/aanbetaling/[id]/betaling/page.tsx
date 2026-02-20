import { Suspense } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl } from '@/shared/lib/api/image';
import { getPaymentStatusAction, checkTripPaymentStatus } from '@/app/reis/actions';
import PaymentStatusDisplay from '@/shared/ui/payment/PaymentStatusDisplay';
import { CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string; transaction_id?: string; status?: string }>;
}

async function BetalingContent({ params, searchParams }: PageProps) {
    const { id } = await params;
    const sParams = await searchParams;
    const signupId = parseInt(id);
    const token = typeof sParams.token === 'string' ? sParams.token : undefined;

    const result = await getPaymentStatusAction(signupId, token);

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4">
                <div className="text-center max-w-md">
                    <XCircle className="h-16 w-16 text-[var(--theme-error)] mx-auto mb-4" />
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-2">Toegang Geweigerd</h1>
                    <p className="text-[var(--text-muted)] mb-6 text-sm sm:text-base">
                        {result.error || 'Je hebt geen toegang tot deze pagina of de aanmelding bestaat niet.'}
                    </p>
                    <Link
                        href="/reis"
                        className="px-6 py-3 bg-[var(--color-purple-600)] text-white rounded-lg hover:bg-[var(--color-purple-700)] transition inline-block"
                    >
                        Terug naar reis pagina
                    </Link>
                </div>
            </div>
        );
    }

    const { signup, trip } = result.data;
    const initialStatus = (signup.deposit_paid || sParams.status === 'success') ? 'SUCCESS' : 'PENDING';

    // Bind the check action with signupId for the client component
    const boundCheckAction = checkTripPaymentStatus.bind(null, signupId, token);

    return (
        <>
            <PageHeader
                title={initialStatus === 'SUCCESS' ? "Betaling Geslaagd" : `Aanbetaling - ${trip.name}`}
                backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />

            <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
                <PaymentStatusDisplay
                    initialStatus={initialStatus}
                    checkStatusAction={boundCheckAction}
                    successContent={
                        <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 sm:p-8 text-center border border-[var(--border-color)]">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] mb-3 sm:mb-4 px-2">Aanbetaling Geslaagd!</h1>
                            <p className="text-base sm:text-lg text-[var(--text-muted)] mb-4 sm:mb-6 px-2">
                                Bedankt voor je aanbetaling van <strong className="whitespace-nowrap">€{Number(trip.deposit_amount).toFixed(2)}</strong> voor {trip.name}!
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-400 p-4 rounded mb-6 sm:mb-8 text-left">
                                <p className="text-sm sm:text-base text-blue-700 dark:text-blue-200">
                                    <strong>📧 Email bevestiging:</strong> Je ontvangt binnen enkele minuten een bevestigingsmail met je reisdetails en een overzicht van je betaling.
                                </p>
                            </div>
                            <p className="text-sm sm:text-base text-[var(--text-muted)] mb-6 sm:mb-8 px-2">
                                We zullen je informeren wanneer je de restbetaling kunt voldoen.
                                Let op: controleer ook je spam/ongewenste e-mail folder als je de bevestiging niet direct ontvangt.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                                <Link
                                    href="/reis"
                                    className="w-full sm:w-auto px-6 py-3 bg-[var(--color-purple-600)] text-white rounded-lg hover:bg-[var(--color-purple-700)] transition text-sm sm:text-base text-center"
                                >
                                    Terug naar reis pagina
                                </Link>
                                <Link
                                    href="/"
                                    className="w-full sm:w-auto px-6 py-3 border border-[var(--border-color)] text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-soft)] transition text-sm sm:text-base text-center"
                                >
                                    Naar homepagina
                                </Link>
                            </div>
                        </div>
                    }
                    failedContent={
                        <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 sm:p-8 text-center border border-[var(--border-color)]">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] mb-3 sm:mb-4 px-2">Betaling Mislukt</h1>
                            <p className="text-base sm:text-lg text-[var(--text-muted)] mb-4 sm:mb-6 px-2">
                                Helaas is je betaling niet gelukt. Dit kan verschillende oorzaken hebben.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                                <Link
                                    href={`/reis/aanbetaling/${signupId}`}
                                    className="w-full sm:w-auto px-6 py-3 bg-[var(--color-purple-600)] text-white rounded-lg hover:bg-[var(--color-purple-700)] transition text-sm sm:text-base text-center"
                                >
                                    Opnieuw proberen
                                </Link>
                                <Link
                                    href="/contact"
                                    className="w-full sm:w-auto px-6 py-3 border border-[var(--border-color)] text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-soft)] transition text-sm sm:text-base text-center"
                                >
                                    Contact opnemen
                                </Link>
                            </div>
                        </div>
                    }
                    pendingContent={
                        <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 sm:p-8 text-center border-t-4 border-[var(--color-purple-600)] mt-8">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--color-purple-600)]" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Wachten op bevestiging</h2>
                            <p className="text-[var(--text-muted)] text-sm mb-6">
                                Heb je al betaald? Het kan enkele minuten duren voordat we de bevestiging van de bank ontvangen.
                            </p>
                            <Link
                                href={`/reis/aanbetaling/${signupId}`}
                                className="w-full px-6 py-3 border border-[var(--border-color)] text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-soft)] transition font-medium flex items-center justify-center"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Terug naar betalen
                            </Link>
                        </div>
                    }
                />
            </div>
        </>
    );
}

export default function AanbetalingBetalingPage(props: PageProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-[var(--color-purple-600)] mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">Pagina laden...</p>
                </div>
            </div>
        }>
            <BetalingContent {...props} />
        </Suspense>
    );
}
