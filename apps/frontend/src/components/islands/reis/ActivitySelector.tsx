'use client';

import React from 'react';
import { Check, Info, Plus, X } from 'lucide-react';
import type { TripActivity, TripSignupActivity } from '@salvemundi/validations/schema/admin-reis.zod';

interface ActivitySelectorProps {
    activities: TripActivity[];
    selectedSelections: { activityId: number; options: any }[];
    onChange: (selections: { activityId: number; options: any }[]) => void;
}

export default function ActivitySelector({ activities, selectedSelections, onChange }: ActivitySelectorProps) {
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

        const currentOptions = selection.options || {};
        const isAlreadySelected = !!currentOptions[optionId];

        let newOptions = { ...currentOptions };

        if (isAlreadySelected) {
            delete newOptions[optionId];
        } else {
            // If single select (maxSelections === 1), clear others
            if (maxSelections === 1) {
                newOptions = { [optionId]: true };
            } else {
                newOptions[optionId] = true;
            }
        }

        onChange(selectedSelections.map(s => 
            s.activityId === activityId ? { ...s, options: newOptions } : s
        ));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-theme-purple" />
                Optionele Activiteiten
            </h3>
            
            <div className="grid gap-4">
                {activities.map((activity) => {
                    const isSelected = selectedSelections.some(s => s.activityId === activity.id);
                    const selection = selectedSelections.find(s => s.activityId === activity.id);
                    const hasOptions = activity.options && activity.options.length > 0;

                    return (
                        <div 
                            key={activity.id}
                            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                                isSelected 
                                ? 'bg-theme-purple/10 border-theme-purple/50 shadow-lg shadow-theme-purple/5' 
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-lg text-white">{activity.name}</h4>
                                        {Number(activity.price) > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-theme-purple/20 text-theme-purple text-xs font-bold">
                                                +€{Number(activity.price).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 max-w-xl">{activity.description}</p>
                                </div>

                                <button
                                    onClick={() => handleToggleActivity(activity.id)}
                                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                                        isSelected
                                        ? 'bg-theme-purple text-white shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20'
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

                            {/* Options Section */}
                            {isSelected && hasOptions && (
                                <div className="px-5 pb-5 pt-0 border-t border-theme-purple/10 mt-2">
                                    <p className="text-xs font-black uppercase tracking-widest text-theme-purple mb-3 mt-4">
                                        Maak je keuze ({activity.max_selections === 1 ? 'één optie' : 'meerdere mogelijk'}):
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {activity.options?.map((opt, idx) => {
                                            const optId = opt.id || `opt-${idx}`;
                                            const isOptSelected = !!selection?.options?.[optId];
                                            return (
                                                <button
                                                    key={optId}
                                                    onClick={() => handleOptionToggle(activity.id, optId, activity.max_selections || 0)}
                                                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                                                        isOptSelected
                                                        ? 'bg-white/10 border-theme-purple/50 text-white'
                                                        : 'bg-transparent border-white/5 text-gray-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                                            isOptSelected 
                                                            ? 'bg-theme-purple border-theme-purple' 
                                                            : 'border-white/20'
                                                        }`}>
                                                            {isOptSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        {opt.name}
                                                    </span>
                                                    {opt.price && Number(opt.price) > 0 && (
                                                        <span className="text-xs text-theme-purple">+€{Number(opt.price).toFixed(2)}</span>
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
                <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center">
                    <p className="text-gray-500">Geen optionele activiteiten beschikbaar.</p>
                </div>
            )}
        </div>
    );
}
