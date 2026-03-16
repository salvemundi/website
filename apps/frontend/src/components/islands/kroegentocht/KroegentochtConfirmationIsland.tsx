'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getKroegentochtStatus } from '@/server/actions/kroegentocht.actions';
import { CheckCircle2, XCircle, Loader2, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function KroegentochtConfirmationIsland() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const signupId = searchParams.get('id');
    
    const [status, setStatus] = useState<'loading' | 'paid' | 'failed' | 'open'>('loading');
    const [signupData, setSignupData] = useState<any>(null);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!signupId) {
            setStatus('failed');
            return;
        }

        const checkStatus = async () => {
            const result = await getKroegentochtStatus(signupId);
            
            if (result.status === 'paid') {
                setStatus('paid');
                setSignupData(result.signup);
            } else if (result.status === 'failed' || result.status === 'error') {
                setStatus('failed');
            } else {
                // Keep polling if open, up to 10 times
                if (attempts < 10) {
                    setTimeout(() => setAttempts(a => a + 1), 2000);
                } else {
                    setStatus('failed');
                }
            }
        };

        checkStatus();
    }, [signupId, attempts]);

    if (status === 'loading' || (status === 'open' && attempts < 10)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                <Loader2 className="w-12 h-12 text-[var(--color-purple-theme)] animate-spin mb-6" />
                <h1 className="text-2xl font-black mb-2">Betaling verwerken...</h1>
                <p className="text-slate-500 dark:text-slate-400">Een ogenblik geduld, we checken de status van je transactie.</p>
            </div>
        );
    }

    if (status === 'paid') {
        return (
            <div className="flex flex-col items-center py-10 sm:py-20 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-black text-center mb-4">
                    Betaling Gelukt!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-10 leading-relaxed px-4">
                    Je bent officieel ingeschreven voor de Kroegentocht. We hebben de tickets ook naar je e-mailadres gestuurd.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg px-4">
                    <Link 
                        href="/kroegentocht"
                        className="flex items-center justify-center gap-2 bg-[var(--color-purple-theme)] text-white font-black py-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Tickets bekijken
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link 
                        href="/"
                        className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Terug naar Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-20 animate-in fade-in duration-500 text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-6" />
            <h1 className="text-3xl font-black mb-4">Oeps, er ging iets mis</h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mb-10">
                We konden je betaling niet bevestigen. Als je denkt dat er geld is afgeschreven, neem dan contact met ons op.
            </p>
            <Link 
                href="/kroegentocht"
                className="bg-slate-800 text-white font-black px-8 py-4 rounded-2xl hover:bg-slate-900 transition-all"
            >
                Opnieuw proberen
            </Link>
        </div>
    );
}
