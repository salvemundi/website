'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTripSignup, createTripPayment } from '@/app/reis/actions';
import { Trip, TripActivity, TripSignup } from '@/shared/lib/api/types';
import {
    CheckCircle2,
    Loader2,
    CreditCard,
    FileText,
    AlertCircle,
    Pencil,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface RemainderPaymentFormProps {
    signup: TripSignup;
    trip: Trip;
    activities: TripActivity[];
    selectedActivities: number[];
    selectedActivityOptions: Record<number, string[]>;
    token?: string;
}

export default function RemainderPaymentForm({
    signup,
    trip,
    activities,
    selectedActivities,
    selectedActivityOptions,
    token
}: RemainderPaymentFormProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState({
        first_name: signup.first_name || '',
        middle_name: signup.middle_name || '',
        last_name: signup.last_name || '',
        date_of_birth: signup.date_of_birth ? signup.date_of_birth.split('T')[0] : '',
        id_document_type: (signup.id_document_type || (signup as any).id_document as 'passport' | 'id_card') || '',
        document_number: signup.document_number || '',
        allergies: signup.allergies || (signup as any).alergies || '',
        special_notes: signup.special_notes || '',
        willing_to_drive: signup.willing_to_drive || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const updateResult = await updateTripSignup(signup.id, {
                ...form,
                willing_to_drive: trip.is_bus_trip ? form.willing_to_drive : undefined,
            }, token);

            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }

            setIsEditing(false);
            router.refresh();
        } catch (err: any) {
            console.error('Error saving details:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het opslaan van je gegevens.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePayment = async () => {
        setPaying(true);
        setError(null);
        try {
            const paymentResult = await createTripPayment(signup.id, 'remainder', token);

            if (paymentResult.success && paymentResult.checkoutUrl) {
                window.location.href = paymentResult.checkoutUrl;
            } else {
                throw new Error(paymentResult.error || 'Kon betaling niet starten');
            }
        } catch (err: any) {
            console.error('Error initiating payment:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het starten van de betaling.');
            setPaying(false);
        }
    };

    // Calculate Costs
    // NOTE: Prices from DB might be strings, ensuring number conversion
    const basePrice = Number(trip.base_price) || 0;

    // Calculate total price of selected activities
    // Note: This duplicates logic from ActivitySelectionForm/server. ideally shared.
    const activitiesCost = activities
        .filter(a => selectedActivities.includes(a.id))
        .reduce((sum, a) => {
            let price = Number(a.price) || 0;
            // Add option prices
            const options = selectedActivityOptions[a.id] || [];
            if (a.options && options.length > 0) {
                options.forEach(optName => {
                    const opt = a.options?.find(o => o.name === optName);
                    if (opt) price += Number(opt.price);
                });
            }
            return sum + price;
        }, 0);

    const crewDiscount = (signup as any).role === 'crew' ? (Number(trip.crew_discount) || 0) : 0;
    const deposit = Number(trip.deposit_amount) || 0;

    // Total cost logic: Base + Activities - CrewDiscount
    const totalCost = basePrice + activitiesCost - crewDiscount;

    // Remaining to pay: Total - Deposit
    // Ensure we don't show negative remaining
    const remaining = Math.max(0, totalCost - deposit);

    const isPaid = signup.full_payment_paid;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-300 flex items-start shadow-sm">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Personal Information */}
            <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-8 border-t-4 border-purple-600 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="flex items-center">
                        <FileText className="h-7 w-7 text-purple-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Jouw gegevens</h2>
                    </div>
                    {!isEditing && !isPaid && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center text-sm bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Wijzigen
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleSaveDetails} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Voornaam</label>
                                <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Tussenvoegsel</label>
                                <input type="text" name="middle_name" value={form.middle_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Achternaam</label>
                                <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Geboortedatum</label>
                                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">ID Document Type</label>
                                <select name="id_document_type" value={form.id_document_type} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white">
                                    <option value="">Selecteer...</option>
                                    <option value="passport">Paspoort</option>
                                    <option value="id_card">ID Kaart</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Document nummer</label>
                                <input type="text" name="document_number" value={form.document_number} onChange={handleChange} required={!!form.id_document_type} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Allergieën</label>
                            <textarea name="allergies" value={form.allergies} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Bijzonderheden</label>
                            <textarea name="special_notes" value={form.special_notes} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 dark:bg-[var(--bg-soft-dark)] dark:text-white" />
                        </div>

                        {trip.is_bus_trip && (
                            <div className="flex items-start pt-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center h-5">
                                    <input
                                        id="willing_to_drive"
                                        type="checkbox"
                                        name="willing_to_drive"
                                        checked={form.willing_to_drive}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 transition-colors"
                                    />
                                </div>
                                <label htmlFor="willing_to_drive" className="ml-3 cursor-pointer">
                                    <div className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                                        Ik wil vrijwillig rijden
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center">
                                <X className="w-4 h-4 mr-2" /> Annuleren
                            </button>
                            <button type="submit" disabled={submitting} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Opslaan
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4 text-sm sm:text-base">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Naam</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{form.first_name} {form.middle_name} {form.last_name}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Geboortedatum</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{form.date_of_birth ? format(new Date(form.date_of_birth), 'd MMMM yyyy', { locale: nl }) : '-'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Document</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {form.id_document_type === 'passport' ? 'Paspoort' : form.id_document_type === 'id_card' ? 'ID Kaart' : '-'}
                                    {form.document_number ? ` (${form.document_number})` : ''}
                                </span>
                            </div>
                            {trip.is_bus_trip && (
                                <div>
                                    <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Busje rijden</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{form.willing_to_drive ? 'Ja, ik wil rijden' : 'Nee'}</span>
                                </div>
                            )}
                        </div>

                        {(form.allergies || form.special_notes) && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {form.allergies && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Allergieën</span>
                                        <span className="text-gray-900 dark:text-white">{form.allergies}</span>
                                    </div>
                                )}
                                {form.special_notes && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Bijzonderheden</span>
                                        <span className="text-gray-900 dark:text-white">{form.special_notes}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Activities Read-Only / Links */}
            <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-8 border-t-4 border-blue-600 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gekozen Activiteiten</h2>
                    {/* Only allow changing activities if not fully paid yet, or maybe always allow if policy permits? Assuming no changes after full payment for now unless via admin */}
                    {!isPaid && (
                        <button
                            onClick={() => router.push(token ? `/reis/activiteiten/${signup.id}?token=${token}` : `/reis/activiteiten/${signup.id}`)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
                        >
                            Wijzigen
                        </button>
                    )}
                </div>

                {selectedActivities.length > 0 ? (
                    <div className="space-y-4">
                        {activities
                            .filter(a => selectedActivities.includes(a.id))
                            .map(activity => (
                                <div key={activity.id} className="flex justify-between items-start py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    <div>
                                        <span className="font-semibold text-gray-900 dark:text-white block">{activity.name}</span>
                                        {selectedActivityOptions[activity.id] && selectedActivityOptions[activity.id].length > 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400 block mt-1">
                                                + {selectedActivityOptions[activity.id].join(', ')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900 dark:text-white">€{Number(activity.price).toFixed(2)}</span>
                                        {selectedActivityOptions[activity.id] && (() => {
                                            let optsPrice = 0;
                                            selectedActivityOptions[activity.id].forEach(optName => {
                                                const opt = activity.options?.find(o => o.name === optName);
                                                if (opt) optsPrice += Number(opt.price);
                                            });
                                            return optsPrice > 0 ? <span className="text-xs text-gray-500 block">+ €{optsPrice.toFixed(2)}</span> : null;
                                        })()}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Geen activiteiten geselecteerd.</p>
                )}

                <div className="pt-4 flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-700 mt-4 h-12">
                    <span className="text-gray-700 dark:text-gray-300">Totaal activiteiten:</span>
                    <span className="text-blue-600 dark:text-blue-400">€{activitiesCost.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-8 border-t-4 border-green-600 overflow-hidden">
                <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <CreditCard className="h-7 w-7 text-green-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kostenoverzicht</h2>
                </div>

                <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <span>Basisprijs reis</span>
                        <span>€{basePrice.toFixed(2)}</span>
                    </div>
                    {activitiesCost > 0 && (
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span>Activiteiten</span>
                            <span>€{activitiesCost.toFixed(2)}</span>
                        </div>
                    )}
                    {crewDiscount > 0 && (
                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                            <span>Crew korting</span>
                            <span>- €{crewDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <span>Reeds betaalde aanbetaling</span>
                        <span>- €{deposit.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Te betalen</span>
                            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                                €{remaining.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {remaining > 0 ? (
                    <div className="flex justify-end">
                        <button
                            onClick={handlePayment}
                            disabled={paying}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center text-lg"
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="animate-spin h-6 w-6 mr-3" />
                                    ...
                                </>
                            ) : (
                                <>
                                    Restbetaling voldoen
                                    <CreditCard className="ml-3 h-6 w-6" />
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded flex items-center shadow-sm">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                        <div>
                            <p className="font-bold text-green-800 dark:text-green-300">Volledig betaald!</p>
                            <p className="text-sm text-green-700 dark:text-green-200/80">Je hebt de reis en activiteiten volledig betaald.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
