import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
    step: number;
}

export function StepIndicator({ step }: StepIndicatorProps) {
    const steps = [1, 2, 3];
    
    return (
        <div className="flex items-center justify-center gap-4 mb-12">
            {steps.map((s) => (
                <React.Fragment key={s}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        step === s ? 'bg-theme-purple text-white shadow-xl shadow-theme-purple/20' : 
                        step > s ? 'bg-green-500 text-white' : 'bg-white/5 text-[var(--text-muted)] border border-[var(--border-color)]/20'
                    }`}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-8 md:w-16 h-[2px] transition-all ${
                            step > s ? 'bg-green-500' : 'bg-[var(--border-color)]/20'
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
