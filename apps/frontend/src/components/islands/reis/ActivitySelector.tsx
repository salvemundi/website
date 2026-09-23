'use client';

import React from 'react';
import { Check, Compass } from 'lucide-react';
import type { TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import MediaAsset from '@/components/ui/media/MediaAsset';

export interface SelectedActivity {
    activityId: number;
    options: Record<string, boolean>;
}

interface ActivitySelectorProps {
    activities: TripActivity[];
    selectedSelections: SelectedActivity[];
    onChange: (selections: SelectedActivity[]) => void;
    hideHeader?: boolean;
}

export default function ActivitySelector({ activities, selectedSelections, onChange, hideHeader = false }: ActivitySelectorProps) {
    const handleToggleActivity = (activityId: number) => {
        const isSelected = selectedSelections.some(s => s.activityId === activityId);
        if (isSelected) {
            onChange(selectedSelections.filter(s => s.activityId !== activityId));
        } else {
            onChange([...selectedSelections, { activityId, options: {} }]);
        }
    };

    const handleOptionToggle = (activityId: number, optionId: string, maxSelections: number = 0) => {
        const selection = selectedSelections.find(s => s.activityId === activityId);
        if (!selection) return;

        const optionsMap = new Map(Object.entries(selection.options));
        const isAlreadySelected = optionsMap.has(optionId);

        if (isAlreadySelected) {
            optionsMap.delete(optionId);
        } else {
            // If single select (maxSelections === 1), clear others
            if (maxSelections === 1) {
                optionsMap.clear();
            }
            optionsMap.set(optionId, true);
        }

        const newOptions = Object.fromEntries(optionsMap.entries());

        onChange(selectedSelections.map(s => 
            s.activityId === activityId ? { ...s, options: newOptions } : s
        ));
    };

    return (
        <div className="space-y-6">
            {!hideHeader && (
                <header className="mb-6 border-b border-border-color/30 pb-4">
                    <h2 className="mb-1 flex items-center gap-3 text-2xl font-black tracking-tighter text-text-main italic sm:text-3xl">
                        <Compass className="size-7 text-theme-purple" />
                        Optionele Activiteiten
                    </h2>
                    <p className="text-sm text-text-muted">Kies de extra activiteiten die je wilt doen tijdens de reis.</p>
                </header>
            )}
            
            <div className="grid gap-4">
                {activities.map((activity) => {
                    const isSelected = selectedSelections.some(s => s.activityId === activity.id);
                    const selection = selectedSelections.find(s => s.activityId === activity.id);
                    const hasOptions = activity.options && activity.options.length > 0;

                    return (
                        <div 
                            key={activity.id}
                            className={`relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
                                isSelected 
                                ? 'border-theme-purple/50 bg-theme-purple/10 shadow-lg shadow-theme-purple/5' 
                                : 'border-border-color/30 bg-bg-card hover:border-theme-purple/30'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row">
                                {activity.image && (
                                    <div className="relative h-48 min-h-48 w-full shrink-0 overflow-hidden border-b border-border-color/10 bg-slate-950 md:h-auto md:min-h-0 md:w-48 md:border-r md:border-b-0">
                                        <MediaAsset asset={activity.image} alt={activity.name} fill objectFit="contain" />
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                                    <div className="flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <h4 className="text-lg font-bold text-text-main">{activity.name}</h4>
                                        </div>
                                        <p className="max-w-xl text-sm text-text-muted">{activity.description}</p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-4 self-end md:self-auto">
                                        {Number(activity.price) > 0 && (
                                            <span className="text-base font-extrabold whitespace-nowrap text-theme-purple">
                                                + €{Number(activity.price).toFixed(2)}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActivity(activity.id as number)}
                                            className={`form-button flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold whitespace-nowrap transition-all ${
                                                isSelected
                                                ? 'bg-theme-purple text-white shadow-md'
                                                : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                            }`}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check className="size-4" />
                                                    Geselecteerd
                                                </>
                                            ) : (
                                                <>
                                                    Voeg toe
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Options Section */}
                            {isSelected && hasOptions && (
                                <div className="mt-2 border-t border-theme-purple/10 px-5 pt-0 pb-5">
                                    <p className="mt-4 mb-3 text-xs font-bold tracking-widest text-theme-purple">
                                        Maak je keuze ({activity.max_selections === 1 ? 'één optie' : 'meerdere mogelijk'}):
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {activity.options?.map((opt, idx) => {
                                            const optId = opt.id || `opt-${idx}`;
                                            const isOptSelected = selection?.options ? !!new Map(Object.entries(selection.options)).get(optId) : false;
                                            return (
                                                <button
                                                    type="button"
                                                    key={optId}
                                                    onClick={() => handleOptionToggle(activity.id as number, optId, activity.max_selections || 0)}
                                                    className={`form-button flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm font-medium transition-all ${
                                                        isOptSelected
                                                        ? 'border-theme-purple/40 bg-theme-purple/15 text-text-main'
                                                        : 'border-border-color/20 bg-bg-soft/45 text-text-muted hover:border-border-color/40 hover:bg-bg-soft/80'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <div className={`flex size-4 items-center justify-center rounded border transition-all ${
                                                            isOptSelected 
                                                            ? 'border-theme-purple bg-theme-purple' 
                                                            : 'border-border-color/40'
                                                        }`}>
                                                            {isOptSelected && <Check className="size-3 text-white" />}
                                                        </div>
                                                        {opt.name}
                                                    </span>
                                                    {opt.price && Number(opt.price) > 0 && (
                                                        <span className="text-xs font-semibold text-theme-purple">+€{Number(opt.price).toFixed(2)}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {activities.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border-color/20 p-8 text-center">
                    <p className="text-text-muted">Geen optionele activiteiten beschikbaar.</p>
                </div>
            )}
        </div>
    );
}



