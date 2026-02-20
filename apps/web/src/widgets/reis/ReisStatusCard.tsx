import Link from 'next/link';
import { CheckCircle2, CreditCard, Utensils, AlertCircle, Clock, ExternalLink } from 'lucide-react';

interface ReisStatusCardProps {
    signup: {
        id: number;
        status: 'registered' | 'waitlist' | 'confirmed' | 'cancelled';
        deposit_paid: boolean;
        full_payment_paid: boolean;
    };
    trip: {
        id: number;
        name: string;
        allow_final_payments?: boolean;
        end_date?: string | null;
    };
}

export default function ReisStatusCard({ signup, trip }: ReisStatusCardProps) {
    // Determine status display details
    const getStatusDisplay = () => {
        if (signup.status === 'cancelled') return { text: 'Geannuleerd', color: 'text-red-500', bg: 'bg-red-500/10' };
        if (signup.status === 'waitlist') return { text: 'Wachtrij', color: 'text-orange-500', bg: 'bg-orange-500/10' };

        // Geregistreerd (maar nog niet goedgekeurd): Toon enkel de status
        if (signup.status === 'registered') return { text: 'Geregistreerd, in afwachting', color: 'text-blue-500', bg: 'bg-blue-500/10' };

        if (signup.status === 'confirmed') {
            if (signup.full_payment_paid) return { text: 'Betaald', color: 'text-green-500', bg: 'bg-green-500/10' };
            // Bevestigd (Aanbetaling open)
            if (!signup.deposit_paid) return { text: 'Aanbetaling verwacht', color: 'text-purple-500', bg: 'bg-purple-500/10' };
            // Aanbetaling voldaan (Restbetaling open)
            return { text: 'Restbetaling verwacht', color: 'text-purple-500', bg: 'bg-purple-500/10' };
        }

        return { text: 'In afwachting', color: 'text-gray-500', bg: 'bg-gray-500/10' };
    };

    const statusInfo = getStatusDisplay();

    // Check if trip has ended
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripEndDate = trip.end_date ? new Date(trip.end_date) : null;
    const isTripEnded = tripEndDate ? tripEndDate < today : false;

    return (
        <div className="bg-gradient-to-br from-theme-purple/5 to-theme-purple/10 rounded-2xl p-6 border border-theme-purple/20">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-theme-purple/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-theme-purple" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-theme-purple dark:text-theme-white">Jouw Status</h3>
                    <p className="text-theme-text-muted text-sm break-words">Je bent aangemeld voor: {trip.name}</p>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-6 border border-theme-purple/10 mb-6">
                <p className="text-sm font-semibold text-theme-text-muted uppercase tracking-wider mb-2">Huidige status</p>
                <div className="flex flex-col gap-2">
                    <p className={`text-2xl sm:text-3xl font-black break-words ${statusInfo.color}`}>
                        {statusInfo.text}
                    </p>

                    {signup.status === 'registered' && (
                        <p className="text-sm text-theme-text-muted italic flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            Je aanmelding wordt beoordeeld door de commissie.
                        </p>
                    )}

                    {signup.status === 'waitlist' && (
                        <p className="text-sm text-theme-text-muted italic flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Je staat op de wachtlijst. We nemen contact op als er plek vrijkomt.
                        </p>
                    )}
                </div>
            </div>

            {/* Confirmed Logic: Payment */}
            {signup.status === 'confirmed' && (
                <div className="space-y-4 mb-6">
                    {/* Deposit Payment */}
                    {!signup.deposit_paid && !signup.full_payment_paid && (
                        <div className="pt-4 border-t border-theme-purple/20">
                            <Link
                                href={`/reis/aanbetaling/${signup.id}`}
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition group font-semibold shadow-lg shadow-theme-purple/20"
                            >
                                <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                Aanbetaling doen
                            </Link>
                            <p className="text-xs text-center text-theme-text-muted mt-2 font-medium">
                                Voldoe de aanbetaling om je plek te garanderen.
                            </p>
                        </div>
                    )}

                    {/* Remainder Payment */}
                    {signup.deposit_paid && !signup.full_payment_paid && (
                        <div className="pt-4 border-t border-theme-purple/20">
                            {trip.allow_final_payments ? (
                                <Link
                                    href={`/reis/restbetaling/${signup.id}`}
                                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-theme-purple to-pink-600 text-white rounded-lg hover:from-theme-purple-dark hover:to-pink-700 transition group font-semibold shadow-lg"
                                >
                                    <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    Restbetaling doen
                                </Link>
                            ) : (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm text-center border border-blue-100 dark:border-blue-900/30">
                                    <Clock className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                                    De restbetaling is nog niet geopend. Je ontvangt bericht wanneer dit mogelijk is.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Completed State */}
                    {signup.full_payment_paid && (
                        <div className="pt-4 border-t border-theme-purple/20">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-center justify-center gap-3 border border-green-200 dark:border-green-900/30">
                                <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                                <span className="font-bold text-center">Alles is betaald! We zien je op reis!</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Activiteiten Wijzigen (Ongeacht status, zolang reis niet afgelopen) */}
            {!isTripEnded && (signup.status === 'registered' || signup.status === 'confirmed') && (
                <div className="pt-4 border-t border-theme-purple/20">
                    <Link
                        href={`/reis/activiteiten/${signup.id}`}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white dark:bg-white/10 text-theme-purple dark:text-white border-2 border-theme-purple dark:border-white/20 rounded-lg hover:bg-theme-purple/5 dark:hover:bg-white/20 transition group font-semibold"
                    >
                        <Utensils className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        Activiteiten inzien of aanpassen
                        <ExternalLink className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-xs text-center text-theme-text-muted mt-2 italic font-medium">
                        Bekijk je gekozen opties of breid je pakket uit.
                    </p>
                </div>
            )}
        </div>
    );
}
