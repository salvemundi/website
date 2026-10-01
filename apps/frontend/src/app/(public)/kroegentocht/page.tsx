export const dynamic = 'force-dynamic';
import { getKroegentochtEvent, getKroegentochtTickets } from '@/server/actions/events/kroegentocht/kroegentocht-public.actions';
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
            <div className="squircle-lg bg-bg-card p-8 text-center shadow-lg dark:border dark:border-white/10">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-theme-purple/10">
                    <Calendar className="size-8 text-theme-purple" />
                </div>
                <h2 className="text-xl font-black text-theme-purple">Geen actieve Kroegentocht</h2>
                <p className="mt-2 text-text-muted">
                    Er is momenteel geen kroegentocht gepland waarvoor je je kunt inschrijven.
                </p>
            </div>
        );
    }

    if (!event.show) {
        return (
            <div className="squircle-lg border border-slate-200 bg-slate-100 p-8 text-center dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xl font-black">{event.name}</h2>
                <p className="mt-2 text-slate-500 italic">{event.disabled_message || 'De inschrijvingen voor de kroegentocht zijn momenteel gesloten.'}</p>
            </div>
        );
    }

    const formattedDate = formatDate(event.date);

    return (
        <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div className="w-full lg:w-1/2">
                <KroegentochtFormIsland event={event} initialUser={session?.user} />
            </div>

            <div className="flex w-full flex-col gap-6 lg:w-1/2">
                <section className="squircle sm:squircle-lg bg-bg-card p-6 shadow-lg sm:p-8 dark:border dark:border-white/10">
                    <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-theme-purple sm:text-2xl">
                        <Info className="size-7 text-theme-purple" />
                        Over de Kroegentocht
                    </h2>
                    <div className="prose max-w-none space-y-4 leading-relaxed text-slate-600 dark:text-slate-400 dark:prose-invert">
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

                <section className="squircle sm:squircle-lg bg-bg-card p-6 shadow-lg sm:p-8 dark:border dark:border-white/10">
                    <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-theme-purple sm:text-2xl">
                        <Calendar className="size-7 text-theme-purple" />
                        Activiteit Details
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <Clock className="mt-1 size-5 shrink-0 text-theme-purple" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Datum</p>
                                <p className="font-bold">{formattedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-1 size-5 shrink-0 text-theme-purple" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Locatie</p>
                                <p className="font-bold">Eindhoven Centrum</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="mt-1 size-5 shrink-0 text-theme-purple" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Organisatie</p>
                                <p className="font-bold">Salve Mundi</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="mt-1 size-5 shrink-0 text-theme-purple" />
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Contact</p>
                                <div className="font-bold break-all text-theme-purple">
                                    <ObfuscatedEmail email={event.email || 'ict@salvemundi.nl'} showIcon={false} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="squircle sm:squircle-lg bg-bg-card p-6 shadow-lg sm:p-8 dark:border dark:border-white/10">
                    <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-theme-purple sm:text-2xl">
                        <ShieldAlert className="size-7 text-theme-purple" />
                        Belangrijke Info
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {[
                            { icon: <ShieldCheck className="size-5" />, title: 'Lidmaatschap', content: <>Je hoeft <strong>geen lid</strong> te zijn om deel te nemen.</> },
                            { icon: <Mail className="size-5" />, title: 'Bevestiging', content: <>Je ontvangt een bevestigingsmail na inschrijving.</> },
                            { icon: <Info className="size-5" />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
                            { icon: <Ticket className="size-5" />, title: 'Tickets', content: <>Tickets zijn <strong>overdraagbaar</strong>.</> },
                        ].map((item, i) => (
                            <div key={i} className="group flex gap-4">
                                <div className="squircle flex size-10 shrink-0 items-center justify-center border border-theme-purple/10 bg-theme-purple/5 text-theme-purple">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest text-text-muted">{item.title}</p>
                                    <div className="text-sm leading-relaxed font-medium text-text-main">
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
