import { Suspense } from 'react';
import { Calendar, Users, Ticket, Activity, AlertCircle, UserCheck, Cake, Award, Plus, FileText, Shield } from 'lucide-react';
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Snelle Acties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard title="Nieuwe" subtitle="Activiteit" icon={<Plus className="h-6 w-6" />} href="/beheer/activiteiten/nieuw" colorClass="purple" />
                <ActionCard title="Nieuwe" subtitle="Intro Post" icon={<FileText className="h-6 w-6" />} href="/beheer/intro?tab=blogs&create=1" colorClass="blue" disabled={!permissions.canAccessIntro} />
                {permissions.canAccessSync && <ActionCard title="Sync" subtitle="Leden" icon={<Users className="h-6 w-6" />} href="/beheer/sync" colorClass="green" />}
                {permissions.canAccessSync && <ActionCard title="Beheer" subtitle="Commissie" icon={<Shield className="h-6 w-6" />} href="/beheer/vereniging" colorClass="orange" />}
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
                        <div key={person.id} className={`flex items-center justify-between p-3 rounded-xl ${person.isToday ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <div>
                                <p className={`font-semibold ${person.isToday ? 'text-yellow-900 dark:text-yellow-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {person.first_name} {person.last_name}
                                </p>
                                <p className={`text-sm ${person.isToday ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {new Date(person.birthday).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <Cake className={`h-5 w-5 ${person.isToday ? 'text-yellow-600 dark:text-yellow-400' : 'text-purple-600 dark:text-purple-400'}`} />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Geen jarigen gevonden</p>
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
                        <div key={person.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-600'}`}>
                                    {index + 1}
                                </div>
                                <div className="truncate">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                                        {person.first_name} {person.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{person.count}</span>
                                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Geen stickers gevonden</p>
            )}
        </ListCard>
    );
}

export async function ActivitySignupsList() {
    const latestEventsWithSignups = await getRecentActivities();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activiteiten aanmeldingen</h3>
                </div>
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-2">
                {latestEventsWithSignups.length > 0 ? (
                    latestEventsWithSignups.map((ev) => {
                        const eventDate = ev.event_date ? new Date(ev.event_date) : null;
                        const now = new Date();
                        const isPast = eventDate && eventDate.getTime() < now.getTime();

                        return (
                            <a
                                key={ev.id}
                                href={isPast ? undefined : `/beheer/activiteiten/${ev.id}/aanmeldingen`}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isPast ? 'bg-slate-50 dark:bg-slate-700/30 opacity-60 cursor-default' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98]'}`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{ev.name}</div>
                                    {isPast && <span className="text-[10px] bg-slate-400 text-white px-1.5 py-0.5 rounded-full uppercase font-bold">Past</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${isPast ? 'text-slate-400' : 'text-purple-600 dark:text-purple-400'}`}>{ev.signups}</span>
                                    <UserCheck className={`h-4 w-4 ${isPast ? 'text-slate-400' : 'text-purple-600 dark:text-purple-400'}`} />
                                </div>
                            </a>
                        );
                    })
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Geen recente activiteiten</p>
                )}
            </div>
        </div>
    );
}

export async function SystemHealthStatus() {
    const stats = await getDashboardStats();
    const permissions = await getDashboardPermissions();
    if (!permissions.isIct) return null;

    return (
        <div className="mt-8">
            <ListCard title="Systeemstatus" icon={<Activity className="h-5 w-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-100 dark:border-green-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">API Status</p>
                                <p className="text-sm text-green-700 dark:text-green-400">Operationeel</p>
                            </div>
                        </div>
                        <span className="text-green-600 dark:text-green-400 font-black text-xl">✓</span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${stats.systemErrors > 0 
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-700/50'}`}>
                        <div className="flex items-center gap-4">
                            <AlertCircle className={`h-6 w-6 ${stats.systemErrors > 0 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">Systeemfouten</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Laatste 24 uur</p>
                            </div>
                        </div>
                        <span className={`text-2xl font-black ${stats.systemErrors > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>{stats.systemErrors}</span>
                    </div>
                </div>
            </ListCard>
        </div>
    );
}
