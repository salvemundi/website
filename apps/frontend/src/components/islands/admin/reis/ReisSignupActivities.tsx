'use client';

import React from 'react';
import { Utensils, Save, Loader2, Check } from 'lucide-react';
import type { TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';

interface SignupActivitiesProps {
    allActivities: TripActivity[];
    selectedActivities: number[];
    onToggleActivity: (id: number) => void;
    onUpdate: () => void;
    isUpdating: boolean;
    hideButton?: boolean;
    minimal?: boolean;
}

export default function SignupActivities({ 
    allActivities, 
    selectedActivities, 
    onToggleActivity, 
    onUpdate, 
    isUpdating,
    hideButton = false,
    minimal = false
}: SignupActivitiesProps) {
    return (
        <div className={`${minimal ? '' : 'bg-(--beheer-card-bg) rounded-3xl shadow-xl border border-(--beheer-border) p-8'}`}>
            {!minimal && (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-(--beheer-accent)/10 rounded-xl flex items-center justify-center text-(--beheer-accent) shadow-sm">
                            <Utensils className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-semibold text-(--beheer-text) tracking-tight">Activiteiten</h2>
                            <p className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-60">Gekozen voor deze reis</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {allActivities.length === 0 ? (
                    <div className="text-center py-8 bg-(--bg-main)/30 rounded-xl border border-dashed border-(--beheer-border)/50">
                        <p className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-60">Geen activiteiten beschikbaar</p>
                    </div>
                ) : (
                    allActivities.map((activity) => {
                        const isSelected = selectedActivities.includes(activity.id as number);
                        return (
                            <button
                                key={activity.id}
                                type="button"
                                onClick={() => onToggleActivity(activity.id as number)}
                                className={`w-full group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                                    isSelected 
                                    ? 'bg-(--beheer-accent)/10 border-(--beheer-accent)/30 shadow-sm' 
                                    : 'bg-(--bg-main)/40 border-(--beheer-border)/30 hover:border-(--beheer-accent)/40'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-(--beheer-accent) text-white shadow-glow' : 'bg-(--beheer-card-bg) text-(--beheer-text-muted)'
                                    }`}>
                                        <div className="h-4 w-4 flex items-center justify-center font-semibold text-[10px]">
                                            {activity.id}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-[11px] font-semibold transition-colors ${isSelected ? 'text-(--beheer-text)' : 'text-(--beheer-text-muted) group-hover:text-(--beheer-text)'}`}>
                                            {activity.name}
                                        </p>
                                        <p className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-50">
                                            €{Number(activity.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-(--beheer-accent) border-(--beheer-accent)' : 'border-(--beheer-border)'
                                }`}>
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {!hideButton && (
                <button
                    type="button"
                    onClick={onUpdate}
                    disabled={isUpdating}
                    className="mt-8 w-full py-4 bg-(--beheer-accent)/5 hover:bg-(--beheer-accent)/10 text-(--beheer-accent) rounded-2xl font-semibold text-[10px] transition-all flex items-center justify-center gap-3 border border-(--beheer-accent)/10 hover:border-(--beheer-accent)/30 active:scale-95"
                >
                    {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>Activiteiten Opslaan</span>
                </button>
            )}
        </div>
    );
}


