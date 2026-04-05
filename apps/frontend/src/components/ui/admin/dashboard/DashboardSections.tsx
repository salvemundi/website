import { Suspense } from 'react';
import { Calendar, Users, Ticket, Activity, AlertCircle, UserCheck, Cake, Award, Plus, FileText, Shield, MapPin, Mail } from 'lucide-react';
import { StatCard, ActionCard, ListCard } from './LegacyCards';
import { getDashboardStats, getDashboardPermissions, getUpcomingBirthdays, getRecentActivities, getTopStickers } from '@/server/actions/admin.actions';

export async function DashboardQuickStats() {
    const stats = await getDashboardStats();

    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard 
                    title="Activiteiten" 
                    value={stats.upcomingEventsCount} 
                    icon={<Calendar className="h-6 w-6" />} 
                    subtitle="Aankomende events" 
                    href="/beheer/activiteiten" 
                    colorClass="purple" 
                />
                <StatCard 
                    title="Intro" 
                    value={stats.introSignups} 
                    icon={<FileText className="h-6 w-6" />} 
                    subtitle="Aanmeldingen" 
                    href="/beheer/intro" 
                    colorClass="blue" 
                />
                <StatCard 
                    title="Leden" 
                    value={stats.totalMembers} 
                    icon={<Users className="h-6 w-6" />} 
                    subtitle="Actieve leden" 
                    href="/beheer/leden" 
                    colorClass="green" 
                />
                <StatCard 
                    title="Reis" 
                    value={stats.reisSignups} 
                    icon={<FileText className="h-6 w-6" />} 
                    subtitle="Aanmeldingen" 
                    href="/beheer/reis" 
                    colorClass="teal" 
                />
                <StatCard 
                    title="Kroegentocht" 
                    value={stats.pubCrawlSignups} 
                    icon={<Ticket className="h-6 w-6" />} 
                    subtitle="Groepen" 
                    href="/beheer/kroegentocht" 
                    colorClass="orange" 
                />
                <StatCard 
                    title="Coupons" 
                    value={stats.totalCoupons} 
                    icon={<Ticket className="h-6 w-6" />} 
                    subtitle="Actieve codes" 
                    href="/beheer/coupons" 
                    colorClass="amber" 
                />
            </div>
        </div>
    );
}

export async function QuickActions() {
    const permissions = await getDashboardPermissions();

    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-6 border border-[var(--beheer-border)]">
            <h3 className="text-sm font-black text-[var(--beheer-text)] mb-6 uppercase tracking-widest">Snelle Acties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard title="Nieuwe" subtitle="Activiteit" icon={<Plus className="h-6 w-6" />} href="/beheer/activiteiten/nieuw" colorClass="purple" />
                <ActionCard title="Nieuwe" subtitle="Intro Post" icon={<FileText className="h-6 w-6" />} href="/beheer/intro?tab=blogs&create=1" colorClass="blue" disabled={!permissions.canAccessIntro} />
                {permissions.canAccessSync && <ActionCard title="Sync" subtitle="Leden" icon={<Users className="h-6 w-6" />} href="/beheer/sync" colorClass="green" />}
                {permissions.canAccessSync && <ActionCard title="Beheer" subtitle="Commissie" icon={<Shield className="h-6 w-6" />} href="/beheer/vereniging" colorClass="orange" />}
                {permissions.canAccessLogging && <ActionCard title="Logboek" subtitle="Activiteiten" icon={<FileText className="h-6 w-6" />} href="/beheer/logging" colorClass="amber" />}
                {permissions.canAccessStickers && <ActionCard title="Beheer" subtitle="Stickers" icon={<MapPin className="h-6 w-6" />} href="/beheer/stickers" colorClass="purple" />}
                {permissions.isIct && <ActionCard title="Test Modus" subtitle="Impersonatie" icon={<Users className="h-6 w-6" />} href="/beheer/impersonate" colorClass="teal" />}
                {permissions.canAccessMail && <ActionCard title="Mail" subtitle="Beheer" icon={<Mail className="h-6 w-6" />} href="/beheer/mail" colorClass="purple" />}
            </div>
        </div>
    );
}

export async function BirthdaysList() {
    const upcomingBirthdays = await getUpcomingBirthdays();

    return (
        <ListCard title="Aankomende Jarigen" icon={<Cake className="h-5 w-5" />}>
            {upcomingBirthdays.length > 0 ? (
                <div className="space-y-3">
                    {upcomingBirthdays.map((person) => (
                        <div key={person.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${person.isToday ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[var(--beheer-card-soft)] border-[var(--beheer-border)]'}`}>
                            <div>
                                <p className={`text-sm font-black uppercase tracking-tight ${person.isToday ? 'text-amber-600' : 'text-[var(--beheer-text)]'}`}>
                                    {person.first_name} {person.last_name}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                    {new Date(person.birthday).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <Cake className={`h-5 w-5 ${person.isToday ? 'text-amber-500 animate-bounce' : 'text-[var(--beheer-accent)]'}`} />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest text-center py-8">Geen jarigen gevonden</p>
            )}
        </ListCard>
    );
}

export async function TopStickersList() {
    const topStickers = await getTopStickers();

    return (
        <ListCard title="Top Sticker Verzamelaars" icon={<Award className="h-5 w-5" />}>
            {topStickers.length > 0 ? (
                <div className="space-y-3">
                    {topStickers.map((person, index) => (
                        <div key={person.id} className="flex items-center justify-between p-4 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-2xl group hover:border-[var(--beheer-accent)]/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white ${index === 0 ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : index === 1 ? 'bg-slate-400' : 'bg-orange-600'}`}>
                                    {index + 1}
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight truncate">
                                        {person.first_name} {person.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-[var(--beheer-accent)] tracking-tighter">{person.count}</span>
                                <Award className="h-4 w-4 text-[var(--beheer-accent)]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest text-center py-8">Geen stickers gevonden</p>
            )}
        </ListCard>
    );
}

export async function ActivitySignupsList() {
    const latestEventsWithSignups = await getRecentActivities();

    return (
        <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                        <Activity className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-widest">Activiteiten aanmeldingen</h3>
                </div>
            </div>
            <div className="space-y-3">
                {latestEventsWithSignups.length > 0 ? (
                    latestEventsWithSignups.map((ev) => {
                        const eventDate = ev.event_date ? new Date(ev.event_date) : null;
                        const now = new Date();
                        const isPast = eventDate && eventDate.getTime() < now.getTime();

                        return (
                            <a
                                key={ev.id}
                                href={isPast ? undefined : `/beheer/activiteiten/${ev.id}/aanmeldingen`}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${isPast ? 'bg-[var(--beheer-card-soft)]/50 border-[var(--beheer-border)] opacity-60 cursor-default' : 'bg-[var(--beheer-card-soft)] border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30 hover:shadow-md cursor-pointer active:scale-[0.98]'}`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                    <div className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight truncate">{ev.name}</div>
                                    {isPast && <span className="text-[8px] font-black bg-[var(--beheer-border)] text-[var(--beheer-text-muted)] px-1.5 py-0.5 rounded-full uppercase tracking-widest">Past</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-black tracking-tighter ${isPast ? 'text-[var(--beheer-text-muted)]' : 'text-[var(--beheer-accent)]'}`}>{ev.signups}</span>
                                    <UserCheck className={`h-4 w-4 ${isPast ? 'text-[var(--beheer-text-muted)]' : 'text-[var(--beheer-accent)]'}`} />
                                </div>
                            </a>
                        );
                    })
                ) : (
                    <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest text-center py-8">Geen recente activiteiten</p>
                )}
            </div>
        </div>
    );
}

