import React from 'react';
import { Info, Calendar, Clock, MapPin, Users, Mail, ShieldAlert } from 'lucide-react';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

interface KroegentochtInfoProps {
    isLoading?: boolean;
    description?: string | null;
    formattedDate?: string;
    email?: string | null;
}

export function KroegentochtInfo({ 
    isLoading = false, 
    description, 
    formattedDate = 'TBA', 
    email = 'ict@salvemundi.nl' 
}: KroegentochtInfoProps) {
    if (isLoading) {
        return (
            <div className="w-full flex flex-col gap-6 skeleton-active" aria-busy="true">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                        <div className="h-7 w-48 mb-6 bg-[var(--color-purple-theme)]/10 rounded-lg" />
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-[var(--color-purple-theme)]/5 rounded-md" />
                            <div className="h-4 w-5/6 bg-[var(--color-purple-theme)]/5 rounded-md" />
                            <div className="h-4 w-4/6 bg-[var(--color-purple-theme)]/5 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6">
            <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-black text-[var(--color-purple-theme)] mb-6 flex items-center gap-3">
                    <Info className="w-7 h-7" />
                    Over de Kroegentocht
                </h2>
                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
                    {description ? (
                        description.split('\n').map((p, i) => (
                            <p key={i}>{p}</p>
                        ))
                    ) : (
                        <>
                            <p>De jaarlijkse Kroegentocht is een van de grootste activiteiten die tweemaal per jaar wordt georganiseerd!</p>
                            <p>Dit is een fantastische kans om verschillende kroegen te bezoeken, nieuwe mensen te ontmoeten en een onvergetelijke avond te beleven met andere studenten en verenigingen.</p>
                        </>
                    )}
                </div>
            </section>

            <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-black text-[var(--color-purple-theme)] mb-6 flex items-center gap-3">
                    <Calendar className="w-7 h-7" />
                    Activiteit Details
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datum</p>
                            <p className="font-bold">{formattedDate}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Locatie</p>
                            <p className="font-bold">Eindhoven Centrum</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organisatie</p>
                            <p className="font-bold">SV Salve Mundi</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</p>
                            <div className="font-bold text-[var(--color-purple-theme)] break-all">
                                <ObfuscatedEmail email={email || 'ict@salvemundi.nl'} showIcon={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-black text-[var(--color-purple-theme)] mb-6 flex items-center gap-3">
                    <ShieldAlert className="w-7 h-7" />
                    Belangrijke Info
                </h2>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-lg">👥</span> 
                        <span className="text-slate-600 dark:text-slate-400">Je hoeft <strong>geen lid</strong> te zijn om deel te nemen.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-lg">📧</span>
                        <span className="text-slate-600 dark:text-slate-400">Je ontvangt een bevestigingsmail na inschrijving.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-lg">🔞</span>
                        <span className="text-slate-600 dark:text-slate-400">Minimumleeftijd: <strong>18 jaar</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-lg">🎟️</span>
                        <span className="text-slate-600 dark:text-slate-400">Tickets zijn <strong>overdraagbaar</strong>.</span>
                    </li>
                </ul>
            </section>
        </div>
    );
}
