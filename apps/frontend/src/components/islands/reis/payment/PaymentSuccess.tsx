import React from 'react';
import { CheckCircle2, Home } from 'lucide-react';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface PaymentSuccessProps {
    trip: Trip;
}

export function PaymentSuccess({ trip }: PaymentSuccessProps) {
    return (
        <div className="space-y-12 animate-in zoom-in-95 duration-500 py-12 text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto shadow-2xl shadow-green-500/10">
                <CheckCircle2 className="w-12 h-12" />
            </div>
            
             <div className="space-y-4">
                <h2 className="text-4xl font-black text-[var(--text-main)] uppercase italic tracking-tighter italic">Activiteiten Opgeslagen!</h2>
                <p className="text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                    Je keuzes zijn succesvol verwerkt. Zodra de restbetaling voor <strong>{trip.name}</strong> wordt geopend, ontvang je van ons een e-mail om de betaling af te ronden.
                </p>
            </div>

             <a 
                href="/reis" 
                className="inline-flex items-center gap-3 px-10 py-5 bg-theme-purple text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-theme-purple-dark transition-all shadow-xl shadow-theme-purple/5"
            >
                <Home className="w-5 h-5" />
                Terug naar Dashboard
            </a>
        </div>
    );
}
