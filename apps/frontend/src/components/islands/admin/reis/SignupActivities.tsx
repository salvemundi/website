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
}

export default function SignupActivities({ 
    allActivities, 
    selectedActivities, 
    onToggleActivity, 
    onUpdate, 
    isUpdating 
}: SignupActivitiesProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-2xl flex items-center justify-center text-[var(--beheer-accent)]">
                        <Utensils className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Activiteiten</h2>
                </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {allActivities.length === 0 ? (
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)] text-center py-12">Geen activiteiten geconfigureerd.</p>
                ) : allActivities.map(activity => (
                    <label 
                        key={activity.id}
                        className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                            selectedActivities.includes(activity.id) 
                                ? 'bg-[var(--beheer-accent)] border-[var(--beheer-accent)] shadow-lg shadow-[var(--beheer-accent)]/20 text-white' 
                                : 'bg-[var(--bg-main)]/50 border-[var(--beheer-border)]/50 hover:border-[var(--beheer-accent)]/50'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all ${
                                selectedActivities.includes(activity.id) ? 'bg-white text-[var(--beheer-accent)]' : 'bg-[var(--beheer-border)]/20 text-transparent'
                            }`}>
                                <Check className="h-3.5 w-3.5" />
                            </div>
                            <span className={`text-sm font-black uppercase tracking-tight transition-all ${
                                selectedActivities.includes(activity.id) ? 'text-white' : 'text-[var(--beheer-text)]'
                            }`}>
                                {activity.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                selectedActivities.includes(activity.id) ? 'text-white/80' : 'text-[var(--beheer-accent)]'
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
                className="mt-6 w-full py-4 bg-[var(--bg-main)] hover:bg-[var(--beheer-accent)]/10 text-[var(--beheer-text)] hover:text-[var(--beheer-accent)] rounded-[var(--beheer-radius)] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30"
            >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Activiteiten Bijwerken
            </button>
        </div>
    );
}
