'use client';

import React from 'react';
import { Utensils, Save, Loader2, Check } from 'lucide-react';
import type { TripActivity } from '@salvemundi/validations';

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
        <div className={minimal ? '' : 'card-base-padded'}>
            {!minimal && (
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="icon-box">
                            <Utensils className="size-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-semibold tracking-tight text-beheer-text">Activiteiten</h2>
                            <p className="text-2xs font-semibold text-beheer-text-muted opacity-60">Gekozen voor deze reis</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {allActivities.length === 0 ? (
                    <div className="empty-state-box-dashed">
                        <p className="text-2xs font-semibold text-beheer-text-muted opacity-60">Geen activiteiten beschikbaar</p>
                    </div>
                ) : (
                    allActivities.map((activity) => {
                        const isSelected = selectedActivities.includes(activity.id as number);
                        return (
                            <button
                                key={activity.id}
                                type="button"
                                onClick={() => onToggleActivity(activity.id as number)}
                                className={`beheer-button ${
                                    isSelected ? 'btn-toggle-option-selected' : 'btn-toggle-option-unselected'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`badge-icon-square ${
                                        isSelected ? 'bg-beheer-accent text-wit-paars shadow-md' : 'bg-beheer-card-bg text-beheer-text-muted'
                                    }`}>
                                        <div className="badge-icon-inner">
                                            {activity.id}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-2xs font-semibold transition-colors ${isSelected ? 'text-beheer-text' : 'text-beheer-text-muted hover:text-beheer-text'}`}>
                                            {activity.name}
                                        </p>
                                        <p className="text-2xs font-semibold text-beheer-text-muted opacity-50">
                                            €{Number(activity.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className={`checkbox-indicator-box ${
                                    isSelected ? 'border-beheer-accent bg-beheer-accent' : 'border-beheer-border'
                                }`}>
                                    {isSelected && <Check className="size-3 text-wit-paars" />}
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
                    className="mt-8 beheer-button-secondary w-full"
                >
                    {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                    <span>Activiteiten Opslaan</span>
                </button>
            )}
        </div>
    );
}


