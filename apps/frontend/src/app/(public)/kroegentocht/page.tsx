import { getKroegentochtEvent, getKroegentochtTickets } from '@/server/actions/kroegentocht.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import KroegentochtFormIsland from '@/components/islands/kroegentocht/KroegentochtFormIsland';
import KroegentochtTicketsIsland from '@/components/islands/kroegentocht/KroegentochtTicketsIsland';
import { Info, MapPin, Calendar, Clock, AlertCircle, Users, Mail, ShieldAlert } from 'lucide-react';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { formatDate } from '@/shared/lib/utils/date';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Kroegentocht | SV Salve Mundi',
    description: 'Schrijf je in voor de gezelligste kroegentocht van Eindhoven!',
};

async function TicketsSection({ userEmail }: { userEmail: string }) {
    const tickets = await getKroegentochtTickets(userEmail);
    if (tickets.length === 0) return null;
    return <KroegentochtTicketsIsland initialTickets={tickets} userEmail={userEmail} />;
}

async function RegistrationSection() {
    const [event, session] = await Promise.all([
        getKroegentochtEvent(),
        auth.api.getSession({
            headers: await headers()
        })
    ]);

    if (!event) {
        return (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-amber-900 dark:text-amber-200">Geen actieve Kroegentocht</h2>
                <p className="text-amber-800/80 dark:text-amber-400/80 mt-2">
                    Er is momenteel geen kroegentocht gepland waarvoor je je kunt inschrijven.
                </p>
            </div>
        );
    }

    if (!event.show) {
        return (
            <div className="bg-slate-100 dark:bg-white/5 p-8 rounded-3xl text-center border border-slate-200 dark:border-white/10">
                <h2 className="text-xl font-black">{event.name}</h2>
                <p className="text-slate-500 mt-2 italic">{event.disabled_message || 'De inschrijvingen voor de kroegentocht zijn momenteel gesloten.'}</p>
            </div>
        );
    }

    const formattedDate = formatDate(event.date);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/2">
                <KroegentochtFormIsland event={event} initialUser={session?.user} />
            </div>
            
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--color-purple-theme)] mb-6 flex items-center gap-3">
                        <Info className="w-7 h-7" />
                        Over de Kroegentocht
                    </h2>
                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
                        {event.description ? (
                            event.description.split('\n').map((p: string, i: number) => (
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
                                    <ObfuscatedEmail email={event.email || 'ict@salvemundi.nl'} showIcon={false} />
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
        </div>
    );
}

export default async function KroegentochtPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const isAuthenticated = !!session;

    // NUCLEAR SSR: Fetch tickets if authenticated
    let tickets: any[] = [];
    if (isAuthenticated) {
        tickets = await getKroegentochtTickets(session.user.email!).catch(() => []);
    }

    return (
        <PublicPageShell
            title="KROEGENTOCHT"
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
            imageFilter="brightness(0.55)"
            description="Dé activiteit van het jaar! Verken de beste kroegen van Eindhoven met je medestudenten."
        >
            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 md:py-12">
                {isAuthenticated && tickets.length > 0 && (
                    <KroegentochtTicketsIsland initialTickets={tickets} userEmail={session.user.email!} />
                )}

                <RegistrationSection />
            </div>
        </PublicPageShell>
    );
}


