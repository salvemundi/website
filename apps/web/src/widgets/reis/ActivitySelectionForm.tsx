'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { updateTripActivities } from '@/app/reis/actions';
import { Trip, TripActivity } from '@/shared/lib/api/types';
import { getImageUrl } from '@/shared/lib/api/image';
import { CheckCircle2, Loader2, Save, Utensils, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ActivitySelectionFormProps {
    signupId: number;
    trip: Trip;
    activities: TripActivity[];
    initialSelectedActivities: number[];
    initialActivityOptions: Record<number, string[]>;
    token?: string;
}

export default function ActivitySelectionForm({
    signupId,
    activities,
    initialSelectedActivities,
    initialActivityOptions,
    token
}: ActivitySelectionFormProps) {
    const router = useRouter();
    const [selectedActivities, setSelectedActivities] = useState<number[]>(initialSelectedActivities);
    const [selectedActivityOptions, setSelectedActivityOptions] = useState<Record<number, string[]>>(initialActivityOptions);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Track original state for hasChanges
    // We assume the initial props don't change, so we compare against them directly or simple local copies if needed.

    const toggleActivity = (activityId: number) => {
        if (success) return;
        setSelectedActivities(prev =>
            prev.includes(activityId)
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
        if (error) setError(null);
    };

    const toggleOption = (activityId: number, optionName: string, maxSelections?: number) => {
        if (success) return;
        setSelectedActivityOptions(prev => {
            const current = prev[activityId] || [];

            // If radio (maxSelections === 1), replace. Else toggle.
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

    const hasChanges = useMemo(() => {
        const selectedSorted = selectedActivities.slice().sort((a, b) => a - b);
        const originalSorted = initialSelectedActivities.slice().sort((a, b) => a - b);

        if (JSON.stringify(selectedSorted) !== JSON.stringify(originalSorted)) return true;

        for (const actId of selectedActivities) {
            const opts1 = (selectedActivityOptions[actId] || []).slice().sort();
            const opts2 = (initialActivityOptions[actId] || []).slice().sort();
            if (JSON.stringify(opts1) !== JSON.stringify(opts2)) return true;
        }
        return false;
    }, [selectedActivities, selectedActivityOptions, initialSelectedActivities, initialActivityOptions]);

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

    const handleSave = async () => {
        setError(null);
        setSubmitting(true);

        try {
            const result = await updateTripActivities(signupId, selectedActivities, selectedActivityOptions, token);

            if (!result.success) {
                setError(result.error || 'Er is een fout opgetreden.');
                setSubmitting(false);
                return;
            }

            setSuccess(true);

            // Redirect logic
            setTimeout(() => {
                if (token) {
                    router.push(`/reis/restbetaling/${signupId}?token=${token}`);
                } else {
                    router.push(`/reis/restbetaling/${signupId}`);
                }
                router.refresh();
            }, 1000);

        } catch (err: any) {
            console.error('Error saving activities:', err);
            setError('Er is een onverwachte fout opgetreden.');
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-lg mb-8 animate-fade-in shadow-lg">
                <div className="flex items-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mr-4 flex-shrink-0" />
                    <div>
                        <h3 className="text-green-800 dark:text-green-300 font-bold text-xl mb-1">Activiteiten opgeslagen!</h3>
                        <p className="text-green-700 dark:text-green-200">
                            Je wordt doorgestuurd naar de restbetaling...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-2xl shadow-xl p-6 sm:p-8 border-t-4 border-blue-600 mb-8 relative overflow-hidden">
            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-300 flex items-start animate-fade-in">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <div className="flex items-center mb-8 border-b pb-4 border-gray-100 dark:border-gray-700">
                <Utensils className="h-7 w-7 text-blue-600 mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">Kies je activiteiten</h2>
            </div>

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
                        {/* Checkbox */}
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
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white break-words pr-2">{activity.name}</h3>
                                <div className="text-right flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-sm font-bold">
                                    €{Number(activity.price).toFixed(2)}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-[var(--text-muted-dark)] mb-3 leading-relaxed">{activity.description}</p>

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

            {/* Total */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Totaal extra kosten:</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse-slow">
                    €{totalActivitiesPrice.toFixed(2)}
                </span>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                    href={token ? `/reis/restbetaling/${signupId}?token=${token}` : `/reis/restbetaling/${signupId}`}
                    className="flex-1 py-3.5 px-6 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center font-bold hover:scale-[1.02] active:scale-95"
                >
                    Annuleren
                </Link>
                <button
                    onClick={handleSave}
                    disabled={submitting || !hasChanges}
                    className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            Opslaan...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            Wijzigingen opslaan
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
