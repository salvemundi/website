export const dynamic = 'force-dynamic';
import { getKroegentochtEvent, getKroegentochtTickets } from '@/server/actions/events/kroegentocht.actions';
import { type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { Info, MapPin, Calendar, Clock, Users, Mail, ShieldAlert, ShieldCheck, Ticket } from 'lucide-react';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { formatDate } from '@/shared/lib/utils/date';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import KroegentochtFormIsland from '@/components/islands/kroegentocht/KroegentochtFormIsland';
import KroegentochtTicketsIsland from '@/components/islands/kroegentocht/KroegentochtTicketsIsland';

export const metadata = {
    title: 'Kroegentocht | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste kroegentocht van Eindhoven!'
};

async function RegistrationSection() {
    const [event, session] = await Promise.all([
        getKroegentochtEvent(),
        getEnrichedSession()
    ]);

    if (!event) {
        return (
            <div className="bg-bg-card dark:border dark:border-white/10 p-8 squircle-lg text-center shadow-lg">
                <div className="w-16 h-16 bg-theme-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-8 h-8 text-theme-purple" />
                </div>
                <h2 className="text-xl font-black text-theme-purple">Geen actieve Kroegentocht</h2>
                <p className="text-text-muted mt-2">
                    Er is momenteel geen kroegentocht gepland waarvoor je je kunt inschrijven.
                </p>
            </div>
        );
    }

    if (!event.show) {
        return (
            <div className="bg-slate-100 dark:bg-white/5 p-8 squircle-lg text-center border border-slate-200 dark:border-white/10">
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
                <section className="bg-bg-card dark:border dark:border-white/10 squircle sm:squircle-lg p-6 sm:p-8 shadow-lg">
                    <h2 className="text-xl sm:text-2xl font-black text-theme-purple mb-6 flex items-center gap-3">
                        <Info className="w-7 h-7 text-theme-purple" />
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

                <section className="bg-bg-card dark:border dark:border-white/10 squircle sm:squircle-lg p-6 sm:p-8 shadow-lg">
                    <h2 className="text-xl sm:text-2xl font-black text-theme-purple mb-6 flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-theme-purple" />
                        Activiteit Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-theme-purple shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Datum</p>
                                <p className="font-bold">{formattedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-theme-purple shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Locatie</p>
                                <p className="font-bold">Eindhoven Centrum</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-theme-purple shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Organisatie</p>
                                <p className="font-bold">Salve Mundi</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-theme-purple shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Contact</p>
                                <div className="font-bold text-theme-purple break-all">
                                    <ObfuscatedEmail email={event.email || 'ict@salvemundi.nl'} showIcon={false} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-bg-card dark:border dark:border-white/10 squircle sm:squircle-lg p-6 sm:p-8 shadow-lg">
                    <h2 className="text-xl sm:text-2xl font-black text-theme-purple mb-6 flex items-center gap-3">
                        <ShieldAlert className="w-7 h-7 text-theme-purple" />
                        Belangrijke Info
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { icon: <ShieldCheck className="h-5 w-5" />, title: 'Lidmaatschap', content: <>Je hoeft <strong>geen lid</strong> te zijn om deel te nemen.</> },
                            { icon: <Mail className="h-5 w-5" />, title: 'Bevestiging', content: <>Je ontvangt een bevestigingsmail na inschrijving.</> },
                            { icon: <Info className="h-5 w-5" />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
                            { icon: <Ticket className="h-5 w-5" />, title: 'Tickets', content: <>Tickets zijn <strong>overdraagbaar</strong>.</> },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="h-10 w-10 squircle bg-theme-purple/5 text-theme-purple flex items-center justify-center shrink-0 border border-theme-purple/10">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest text-text-muted">{item.title}</p>
                                    <div className="text-sm text-text-main font-medium leading-relaxed">
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default async function KroegentochtPage() {
    const session = await getEnrichedSession();
    const user = session?.user;

    let tickets: PubCrawlTicket[] = [];
    if (user?.email) {
        tickets = await getKroegentochtTickets(user.email).catch(() => []);
    }

    return (
        <PublicPageShell
            title="Kroegentocht"
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
            imageFilter="brightness(0.55)"
            description="DÉ activiteit van het jaar! Verken de beste kroegen van Eindhoven met je medestudenten."
        >
            <div className="mx-auto max-w-7xl px-fluid-md pt-fluid-lg pb-16 sm:pb-24 lg:pb-32">
                {user?.email && tickets.length > 0 && (
                    <KroegentochtTicketsIsland initialTickets={tickets} userEmail={user.email} />
                )}

                <RegistrationSection />
            </div>
        </PublicPageShell>
    );
}