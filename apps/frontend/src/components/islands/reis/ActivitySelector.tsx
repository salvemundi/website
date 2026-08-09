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
                <header className="mb-6 pb-4 border-b border-border-color/30">
                    <h2 className="text-2xl sm:text-3xl font-black text-text-main mb-1 italic tracking-tighter flex items-center gap-3">
                        <Compass className="w-7 h-7 text-theme-purple" />
                        Optionele Activiteiten
                    </h2>
                    <p className="text-text-muted text-sm">Kies de extra activiteiten die je wilt doen tijdens de reis.</p>
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
                            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col ${
                                isSelected 
                                ? 'bg-theme-purple/10 border-theme-purple/50 shadow-lg shadow-theme-purple/5' 
                                : 'bg-bg-card border-border-color/30 hover:border-theme-purple/30'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row">
                                {activity.image && (
                                    <div className="relative w-full md:w-48 h-48 md:h-auto min-h-48 md:min-h-0 bg-slate-950 shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-border-color/10">
                                        <MediaAsset asset={activity.image} alt={activity.name} fill objectFit="contain" />
                                    </div>
                                )}
                                <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h4 className="font-bold text-lg text-text-main">{activity.name}</h4>
                                        </div>
                                        <p className="text-sm text-text-muted max-w-xl">{activity.description}</p>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                                        {Number(activity.price) > 0 && (
                                            <span className="text-base font-extrabold text-theme-purple whitespace-nowrap">
                                                + €{Number(activity.price).toFixed(2)}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActivity(activity.id as number)}
                                            className={`form-button px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                                isSelected
                                                ? 'bg-theme-purple text-white shadow-md'
                                                : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                            }`}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check className="w-4 h-4" />
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
                                <div className="px-5 pb-5 pt-0 border-t border-theme-purple/10 mt-2">
                                    <p className="text-xs font-bold tracking-widest text-theme-purple mb-3 mt-4">
                                        Maak je keuze ({activity.max_selections === 1 ? 'één optie' : 'meerdere mogelijk'}):
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {activity.options?.map((opt, idx) => {
                                            const optId = opt.id || `opt-${idx}`;
                                            const isOptSelected = selection?.options ? !!new Map(Object.entries(selection.options)).get(optId) : false;
                                            return (
                                                <button
                                                    type="button"
                                                    key={optId}
                                                    onClick={() => handleOptionToggle(activity.id as number, optId, activity.max_selections || 0)}
                                                    className={`form-button flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                                                        isOptSelected
                                                        ? 'bg-theme-purple/15 border-theme-purple/40 text-text-main'
                                                        : 'bg-bg-soft/45 border-border-color/20 text-text-muted hover:border-border-color/40 hover:bg-bg-soft/80'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                                            isOptSelected 
                                                            ? 'bg-theme-purple border-theme-purple' 
                                                            : 'border-border-color/40'
                                                        }`}>
                                                            {isOptSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        {opt.name}
                                                    </span>
                                                    {opt.price && Number(opt.price) > 0 && (
                                                        <span className="text-xs text-theme-purple font-semibold">+€{Number(opt.price).toFixed(2)}</span>
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
                <div className="p-8 rounded-2xl border border-dashed border-border-color/20 text-center">
                    <p className="text-text-muted">Geen optionele activiteiten beschikbaar.</p>
                </div>
            )}
        </div>
    );
}



