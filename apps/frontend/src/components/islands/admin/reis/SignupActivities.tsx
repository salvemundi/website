'use client';

import React from 'react';
import { Utensils, Save, Loader2, Check } from 'lucide-react';
import type { TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';

interface SignupActivitiesProps {
    allActivities: TripActivity[];
    selectedActivities: number[];
    onToggleActivity: (id: number) => void;
    onUpdate: () => void;
    isUpdating: boolean;
}

export default function SignupActivities({ 
    allActivities, 
    selectedActivities, 
    onToggleActivity, 
    onUpdate, 
    isUpdating 
}: SignupActivitiesProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-3xl shadow-xl border border-[var(--beheer-border)] p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)] shadow-sm">
                        <Utensils className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-bold text-[var(--beheer-text)] tracking-tight">Activiteiten</h2>
                        <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Gekozen voor deze reis</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {allActivities.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--bg-main)]/30 rounded-2xl border border-dashed border-[var(--beheer-border)]/50">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-60">Geen activiteiten beschikbaar</p>
                    </div>
                ) : allActivities.map(activity => (
                    <label 
                        key={activity.id}
                        className={`group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border ${
                            selectedActivities.includes(activity.id) 
                                ? 'bg-[var(--beheer-accent)] border-[var(--beheer-accent)] shadow-xl shadow-[var(--beheer-accent)]/10 text-white' 
                                : 'bg-[var(--bg-main)]/50 border-[var(--beheer-border)]/50 hover:border-[var(--beheer-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                                selectedActivities.includes(activity.id) 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-[var(--beheer-border)]/10 text-transparent group-hover:bg-[var(--beheer-accent)]/5'
                            }`}>
                                <Check className={`h-4 w-4 ${selectedActivities.includes(activity.id) ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            <span className={`text-sm font-semibold tracking-tight transition-all ${
                                selectedActivities.includes(activity.id) ? 'text-white' : 'text-[var(--beheer-text)]'
                            }`}>
                                {activity.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-semibold tracking-widest uppercase ${
                                selectedActivities.includes(activity.id) ? 'text-white/80' : 'text-[var(--beheer-accent)] opacity-70'
                            }`}>
                                €{Number(activity.price || 0).toFixed(2)}
                            </span>
                            <input 
                                type="checkbox" 
                                checked={selectedActivities.includes(activity.id)} 
                                onChange={() => onToggleActivity(activity.id)}
                                className="sr-only"
                            />
                        </div>
                    </label>
                ))}
            </div>

            <button
                type="button"
                onClick={onUpdate}
                disabled={isUpdating}
                className="mt-8 w-full py-4 bg-[var(--beheer-accent)]/5 hover:bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] rounded-2xl font-semibold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-[var(--beheer-accent)]/10 hover:border-[var(--beheer-accent)]/30 active:scale-95"
            >
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>Activiteiten Opslaan</span>
            </button>
        </div>
    );
}
