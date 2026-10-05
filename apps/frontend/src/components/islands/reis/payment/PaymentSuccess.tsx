import React from 'react';
import { CheckCircle2, Home } from 'lucide-react';
import { type Trip } from '@salvemundi/validations';

interface PaymentSuccessProps {
    trip: Trip;
}

export function PaymentSuccess({ trip }: PaymentSuccessProps) {
    return (
        <div className="animate-in zoom-in-95 space-y-12 py-12 text-center duration-500">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-green-500/10 text-green-500 shadow-2xl shadow-green-500/10">
                <CheckCircle2 className="size-12" />
            </div>
            
             <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tighter text-(--text-main) italic">Activiteiten Opgeslagen!</h2>
                <p className="mx-auto max-w-md leading-relaxed text-(--text-muted)">
                    Je keuzes zijn succesvol verwerkt. Zodra de restbetaling voor <strong>{trip.name}</strong> wordt geopend, ontvang je van ons een e-mail om de betaling af te ronden.
                </p>
            </div>

             <a 
                href="/reis" 
                className="beheer-button tracking-widest"
            >
                <Home className="size-5" />
                Terug naar Dashboard
            </a>
        </div>
    );
}
