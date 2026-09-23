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
        <div className={`${minimal ? '' : 'rounded-3xl border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-xl'}`}>
            {!minimal && (
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-(--beheer-accent)/10 text-(--beheer-accent) shadow-sm">
                            <Utensils className="size-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-semibold tracking-tight text-(--beheer-text)">Activiteiten</h2>
                            <p className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-60">Gekozen voor deze reis</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {allActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-(--beheer-border)/50 bg-(--bg-main)/30 py-8 text-center">
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
                                className={`group relative beheer-button flex w-full items-center justify-between rounded-xl border p-3 transition-all duration-300 ${
                                    isSelected 
                                    ? 'border-(--beheer-accent)/30 bg-(--beheer-accent)/10 shadow-sm' 
                                    : 'border-(--beheer-border)/30 bg-(--bg-main)/40 hover:border-(--beheer-accent)/40'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                                        isSelected ? 'bg-(--beheer-accent) text-white shadow-glow' : 'bg-(--beheer-card-bg) text-(--beheer-text-muted)'
                                    }`}>
                                        <div className="flex size-4 items-center justify-center text-[10px] font-semibold">
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
                                <div className={`flex size-5 items-center justify-center rounded-md border transition-all ${
                                    isSelected ? 'border-(--beheer-accent) bg-(--beheer-accent)' : 'border-(--beheer-border)'
                                }`}>
                                    {isSelected && <Check className="size-3 text-white" />}
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
                    className="mt-8 beheer-button flex w-full items-center justify-center gap-3 rounded-2xl border border-(--beheer-accent)/10 bg-(--beheer-accent)/5 py-4 text-[10px] font-semibold text-(--beheer-accent) transition-all hover:border-(--beheer-accent)/30 hover:bg-(--beheer-accent)/10 active:scale-95"
                >
                    {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                    <span>Activiteiten Opslaan</span>
                </button>
            )}
        </div>
    );
}


