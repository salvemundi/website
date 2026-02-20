'use client';

import { useState } from 'react';
import { updateTripSignup, updateTripActivities, createTripPayment } from '@/app/reis/actions';
import { Trip, TripActivity, TripSignup } from '@/shared/lib/api/types';
import { getImageUrl } from '@/shared/lib/api/image';
import {
    CheckCircle2,
    Loader2,
    CreditCard,
    FileText,
    Bus,
    Utensils,
    AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface DepositPaymentFormProps {
    signup: TripSignup;
    trip: Trip;
    activities: TripActivity[];
    initialSelectedActivities: number[];
    initialActivityOptions: Record<number, string[]>;
    token?: string;
}

export default function DepositPaymentForm({
    signup,
    trip,
    activities,
    initialSelectedActivities,
    initialActivityOptions,
    token
}: DepositPaymentFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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

    // Activities State
    const [selectedActivities, setSelectedActivities] = useState<number[]>(initialSelectedActivities);
    const [selectedActivityOptions, setSelectedActivityOptions] = useState<Record<number, string[]>>(initialActivityOptions);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
        if (error) setError(null);
    };

    const toggleActivity = (activityId: number) => {
        setSelectedActivities(prev =>
            prev.includes(activityId)
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
    };

    const toggleOption = (activityId: number, optionName: string, maxSelections?: number) => {
        setSelectedActivityOptions(prev => {
            const current = prev[activityId] || [];
            if (maxSelections === 1) {
                return { ...prev, [activityId]: [optionName] };
            } else {
                if (current.includes(optionName)) {
                    return { ...prev, [activityId]: current.filter(o => o !== optionName) };
                } else {
                    return { ...prev, [activityId]: [...current, optionName] };
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.id_document_type) {
            setError('Kies een ID document type.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Update Personal Data
            const updateResult = await updateTripSignup(signup.id, {
                ...form,
                willing_to_drive: trip.is_bus_trip ? form.willing_to_drive : undefined,
            }, token);

            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }

            // 2. Update Activities
            const activitiesResult = await updateTripActivities(
                signup.id,
                selectedActivities,
                selectedActivityOptions,
                token
            );

            if (!activitiesResult.success) {
                throw new Error(activitiesResult.error);
            }

            // 3. Initiate Payment via Server Action
            const paymentResult = await createTripPayment(signup.id, 'deposit', token);

            if (paymentResult.success && paymentResult.checkoutUrl) {
                setSuccess(true);
                // Redirect to Mollie or Status page
                window.location.href = paymentResult.checkoutUrl;
            } else {
                throw new Error(paymentResult.error || 'Kon betaling niet starten');
            }

        } catch (err: any) {
            console.error('Error submitting form:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het opslaan.');
            setSubmitting(false);
        }
    };

    const totalActivitiesPrice = activities
        .filter(a => selectedActivities.includes(a.id))
        .reduce((sum, a) => {
            let price = Number(a.price) || 0;
            const options = selectedActivityOptions[a.id] || [];
            if (a.options) {
                options.forEach(optName => {
                    const opt = a.options?.find(o => o.name === optName);
                    if (opt) price += Number(opt.price);
                });
            }
            return sum + price;
        }, 0);

    if (success) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-lg mb-8 animate-fade-in shadow-lg">
                <div className="flex items-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mr-4 flex-shrink-0" />
                    <div>
                        <h3 className="text-green-800 dark:text-green-300 font-bold text-xl mb-1">Gegevens opgeslagen!</h3>
                        <p className="text-green-700 dark:text-green-200">
                            Je wordt doorgestuurd naar de betaalpagina...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-300 flex items-start shadow-sm">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Personal Information */}
            <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-8 border-t-4 border-purple-600 relative overflow-hidden">
                <div className="flex items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <FileText className="h-7 w-7 text-purple-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aanvullende gegevens</h2>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                Voornaam <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="first_name"
                                type="text"
                                name="first_name"
                                value={form.first_name}
                                onChange={handleChange}
                                required
                                autoComplete="off"
                                suppressHydrationWarning
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="middle_name" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                Tussenvoegsel
                            </label>
                            <input
                                id="middle_name"
                                type="text"
                                name="middle_name"
                                value={form.middle_name}
                                onChange={handleChange}
                                autoComplete="off"
                                suppressHydrationWarning
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                Achternaam <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="last_name"
                                type="text"
                                name="last_name"
                                value={form.last_name}
                                onChange={handleChange}
                                required
                                autoComplete="off"
                                suppressHydrationWarning
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date_of_birth" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                Geboortedatum <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="date_of_birth"
                                type="date"
                                name="date_of_birth"
                                value={form.date_of_birth}
                                onChange={handleChange}
                                suppressHydrationWarning
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="id_document_type" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                ID Document Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="id_document_type"
                                name="id_document_type"
                                value={form.id_document_type}
                                onChange={handleChange}
                                suppressHydrationWarning
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm"
                                required
                            >
                                <option value="">Selecteer...</option>
                                <option value="passport">Paspoort</option>
                                <option value="id_card">ID Kaart</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="document_number" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                Document nummer {form.id_document_type && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                id="document_number"
                                type="text"
                                name="document_number"
                                value={form.document_number}
                                onChange={handleChange}
                                autoComplete="off"
                                suppressHydrationWarning
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm"
                                placeholder="Bijv. BK1234567"
                                required={!!form.id_document_type}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="allergies" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                            Allergieën
                        </label>
                        <textarea
                            id="allergies"
                            name="allergies"
                            value={form.allergies}
                            onChange={handleChange}
                            rows={3}
                            suppressHydrationWarning
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm resize-none"
                            placeholder="Vermeld hier eventuele allergieën..."
                        />
                    </div>

                    <div>
                        <label htmlFor="special_notes" className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                            Bijzonderheden
                        </label>
                        <textarea
                            id="special_notes"
                            name="special_notes"
                            value={form.special_notes}
                            onChange={handleChange}
                            rows={3}
                            suppressHydrationWarning
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-[var(--bg-soft-dark)] dark:text-white transition-all shadow-sm resize-none"
                            placeholder="Overige bijzonderheden die we moeten weten..."
                        />
                    </div>

                    {trip.is_bus_trip && (
                        <div className="flex items-start pt-4 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
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
                                <div className="flex items-center text-sm font-bold text-gray-800 dark:text-white mb-1">
                                    <Bus className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    Ik wil vrijwillig rijden tijdens de busjesreis
                                </div>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                                    We organiseren deze reis met busjes en zoeken vrijwilligers die willen rijden.
                                </p>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Activities Selection */}
            {activities.length > 0 && (
                <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-8 border-t-4 border-blue-600 relative overflow-hidden">
                    <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <Utensils className="h-7 w-7 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activiteiten tijdens de reis</h2>
                    </div>

                    <p className="text-gray-600 dark:text-[var(--text-muted-dark)] mb-8 leading-relaxed">
                        Selecteer de activiteiten waar je aan wilt deelnemen.
                        De kosten worden meegenomen in de <strong>restbetaling</strong> (latere datum).
                    </p>

                    <div className="grid gap-4">
                        {activities.map(activity => (
                            <div
                                key={activity.id}
                                onClick={() => toggleActivity(activity.id)}
                                className={`group relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedActivities.includes(activity.id)
                                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 shadow-md'
                                    : 'bg-gray-50 dark:bg-[var(--bg-soft-dark)] border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
                                    }`}
                            >
                                <div className="absolute top-4 right-4 sm:static sm:mt-1 flex-shrink-0">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedActivities.includes(activity.id)
                                        ? 'bg-blue-500 text-white scale-110'
                                        : 'bg-white dark:bg-black/20 border-2 border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {selectedActivities.includes(activity.id) && (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>

                                {activity.image && (
                                    <div className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                        <Image
                                            src={getImageUrl(activity.image)}
                                            alt={activity.name}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white break-words mb-1">{activity.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-[var(--text-muted-dark)] mb-3 leading-relaxed">{activity.description}</p>

                                    <div className="text-blue-600 dark:text-blue-400 font-bold mb-2">
                                        €{Number(activity.price).toFixed(2)}
                                    </div>

                                    {/* Options */}
                                    {activity.options && activity.options.length > 0 && selectedActivities.includes(activity.id) && (
                                        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Opties selecteren:</p>
                                            <div className="grid sm:grid-cols-2 gap-2">
                                                {activity.options.map((option: any) => (
                                                    <label key={option.name} className="flex items-center gap-3 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                                        <input
                                                            type={activity.max_selections === 1 ? "radio" : "checkbox"}
                                                            name={`activity-options-${activity.id}`}
                                                            checked={selectedActivityOptions[activity.id]?.includes(option.name) || false}
                                                            onChange={() => toggleOption(activity.id, option.name, activity.max_selections)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 rounded"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {option.name}
                                                            {Number(option.price) > 0 && <span className="text-gray-500 ml-1 text-xs">(+€{Number(option.price).toFixed(2)})</span>}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedActivities.length > 0 && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-900/30">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Extra kosten op restfactuur:</span>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">€{totalActivitiesPrice.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Payment Summary */}
            <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-8 border-t-4 border-green-600 overflow-hidden">
                <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <CreditCard className="h-7 w-7 text-green-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aanbetaling</h2>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-8 mb-6 border border-green-100 dark:border-green-900/30 text-center">
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 font-medium">Nu te voldoen</p>
                    <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                        €{Number(trip.deposit_amount).toFixed(2)}
                    </p>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-8 bg-gray-50 dark:bg-[var(--bg-soft-dark)] p-4 rounded-lg">
                    <p>
                        <strong>Let op:</strong> Klik op opslaan om je gegevens te bevestigen. Daarna word je direct doorgestuurd naar de betaalpagina voor de aanbetaling.
                    </p>
                    <p>
                        De kosten voor activiteiten (€{totalActivitiesPrice.toFixed(2)}) worden later via de restbetaling in rekening gebracht.
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting || success}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center text-lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin h-6 w-6 mr-3" />
                                Bezig met opslaan...
                            </>
                        ) : (
                            <>
                                Opslaan en betalen
                                <CreditCard className="ml-3 h-6 w-6" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
