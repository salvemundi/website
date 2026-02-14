'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { getDashboardDataAction, DashboardData } from '@/features/admin/server/dashboard-data';
import {
    Users,
    Calendar,
    Award,
    Cake,
    UserCheck,
    Plus,
    FileText,
    AlertCircle,
    Activity,
    Ticket,
    Shield,
} from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';


function StatCard({
    title,
    value,
    icon,
    subtitle,
    onClick,
    colorClass = 'purple',
    nowrap = false,
    disabled = false
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    onClick?: () => void;
    colorClass?: 'purple' | 'orange' | 'blue' | 'green' | 'red' | 'amber' | 'teal';
    nowrap?: boolean;
    disabled?: boolean;
}) {
    const Component = onClick && !disabled ? 'button' : 'div';

    const colorStyles = {
        purple: {
            gradient: 'from-purple-500 to-purple-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-purple-100'
        },
        orange: {
            gradient: 'from-orange-500 to-orange-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-orange-100'
        },
        amber: {
            gradient: 'from-amber-500 to-amber-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-amber-100'
        },
        teal: {
            gradient: 'from-teal-500 to-teal-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-teal-100'
        },
        blue: {
            gradient: 'from-blue-500 to-blue-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-blue-100'
        },
        green: {
            gradient: 'from-green-500 to-green-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-green-100'
        },
        red: {
            gradient: 'from-red-500 to-red-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-red-100'
        }
    };

    const style = colorStyles[colorClass] || colorStyles.purple;

    return (
        <Component
            onClick={!disabled ? onClick : undefined}
            className={`w-full text-left relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 transform 
                bg-gradient-to-br ${style.gradient} 
                ${onClick && !disabled ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[.98]' : ''}
                ${disabled ? 'opacity-75 grayscale-[0.5] cursor-not-allowed' : ''}
            `}
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 rounded-full bg-black/10 blur-xl" />

            <div className="relative p-6 flex flex-col h-full justify-between z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${style.iconBg} backdrop-blur-sm transition-transform group-hover:rotate-12`}>
                        <div className={style.text}>{icon}</div>
                    </div>
                    {disabled && <Shield className="h-5 w-5 text-white/50" />}
                </div>

                <div>
                    <h3 className={`text-sm font-medium ${style.subtitleText} mb-1 uppercase tracking-wider`}>
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${style.text} ${nowrap ? 'whitespace-nowrap' : ''}`}>
                            {value}
                        </span>
                    </div>
                    {subtitle && (
                        <p className={`text-xs mt-2 ${style.subtitleText} font-medium flex items-center gap-1`}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </Component>
    );
}

function ListCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 h-full flex flex-col transition-shadow hover:shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-theme-purple/10 dark:bg-theme-purple/20 rounded-lg text-theme-purple">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );
}

function ActionCard({ title, subtitle, icon, onClick, colorClass = 'purple', disabled = false }: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'teal';
    disabled?: boolean;
}) {
    const colorStyles = {
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300',
        green: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300',
        red: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300',
        orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300',
        teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300',
    };

    const style = colorStyles[colorClass] || colorStyles.purple;

    if (disabled) {
        return null;
    }

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-current active:scale-[.98] ${style}`}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                    {icon}
                </div>
                <div className="text-left">
                    <p className="font-bold text-sm">{title}</p>
                    <p className="text-xs opacity-80">{subtitle}</p>
                </div>
            </div>
            <div className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                →
            </div>
        </button>
    );
}

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    // State to hold retrieved data
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                // Fetch all data from the secure server action
                const dashboardData = await getDashboardDataAction();
                if (mounted) {
                    setData(dashboardData);
                    setIsLoading(false);
                }
            } catch (err: any) {
                console.error('Dashboard load failed:', err);
                // Allow offline/local bypass only if user object is null (dev mode quirk) but likely we want strict check
                if (mounted) {
                    setError('Geen toegang of fout bij laden data.');
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => { mounted = false; };
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
    };

    if (isLoading) {
        return (
            <>
                <PageHeader
                    title="Admin Dashboard"
                    description="Beheer en statistieken"
                />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    </div>
                </div>
            </>
        );
    }

    if (error && !data) { // Show error if no data loaded
        return (
            <>
                <PageHeader
                    title="Admin Dashboard"
                    description="Beheer en statistieken"
                />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center py-20 text-red-500">
                        <h2 className="text-2xl font-bold mb-2">Fout</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </>
        );
    }

    // Use fetched data (or defaults if something missing)
    const stats = data?.stats || {
        totalSignups: 0,
        upcomingBirthdays: [],
        topStickers: [],
        totalCommitteeMembers: 0,
        upcomingEvents: 0,
        totalEvents: 0,
        stickerGrowthRate: 0,
        introSignups: 0,
        introBlogLikes: 0,
        systemErrors: 0,
        recentActivities: [],
        activeCoupons: 0,
        latestEventsWithSignups: [],
        pubCrawlSignups: 0,
        reisSignups: 0
    };

    const perms = data?.permissions || {
        canViewIntro: false,
        canViewReis: false,
        canViewLogging: false,
        canViewSync: false,
        canViewCoupons: false,
        isIctMember: false
    };

    return (
        <>
            <PageHeader
                title="Admin Dashboard"
                description={`Welkom ${user?.first_name || 'Admin'}`}
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Quick Actions Section */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Overzicht"
                            value="Activiteiten"
                            icon={<Calendar className="h-6 w-6" />}
                            subtitle="Bekijk de activiteiten"
                            onClick={() => router.push('/admin/activiteiten')}
                            colorClass="purple"
                        />
                        <StatCard
                            title="Beheer"
                            value="Intro"
                            icon={<FileText className="h-6 w-6" />}
                            subtitle={`aanmeldingen: ${stats.introSignups}`}
                            onClick={() => router.push('/admin/intro')}
                            colorClass="blue"
                            disabled={!perms.canViewIntro}
                        />
                        <StatCard
                            title="Overzicht"
                            value="Leden"
                            icon={<Users className="h-6 w-6" />}
                            subtitle="Bekijk alle leden"
                            onClick={() => router.push('/admin/leden')}
                            colorClass="green"
                        />
                        <StatCard
                            title="Beheer"
                            value="Reis"
                            icon={<FileText className="h-6 w-6" />}
                            subtitle={`aanmeldingen: ${stats.reisSignups}`}
                            onClick={() => router.push('/admin/reis')}
                            colorClass="teal"
                            disabled={!perms.canViewReis}
                        />
                        <StatCard
                            title="Beheer"
                            value="Kroegentocht"
                            icon={<Ticket className="h-6 w-6" />}
                            subtitle={`aanmeldingen: ${stats.pubCrawlSignups}`}
                            onClick={() => router.push('/admin/kroegentocht')}
                            colorClass="orange"
                        />
                        <StatCard
                            title="Beheer"
                            value="Coupons"
                            icon={<Ticket className="h-6 w-6" />}
                            subtitle={`Actief: ${stats.activeCoupons}`}
                            onClick={() => router.push('/admin/coupons')}
                            colorClass="amber"
                            disabled={!perms.canViewCoupons}
                        />
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mb-8">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                        {/* Snelle Acties - Left side */}
                        <div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Snelle Acties</h3>
                                <div className="space-y-4">
                                    {/* Standard actions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <ActionCard
                                            title="Nieuwe"
                                            subtitle="Activiteit"
                                            icon={<Plus className="h-6 w-6" />}
                                            onClick={() => router.push('/admin/activiteiten/nieuw')}
                                            colorClass="purple"
                                        />
                                        <ActionCard
                                            title="Nieuwe"
                                            subtitle="Intro Post"
                                            icon={<FileText className="h-6 w-6" />}
                                            onClick={() => router.push('/admin/intro?tab=blogs&create=1')}
                                            colorClass="blue"
                                            disabled={!perms.canViewIntro}
                                        />
                                    </div>

                                    {/* Additional actions for ICT/Bestuur */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {perms.canViewSync && (
                                            <ActionCard
                                                title="Sync"
                                                subtitle="Leden"
                                                icon={<Users className="h-6 w-6" />}
                                                onClick={() => router.push('/admin/sync')}
                                                colorClass="green"
                                            />
                                        )}
                                        {perms.canViewSync && (
                                            <ActionCard
                                                title="Beheer"
                                                subtitle="Commissie"
                                                icon={<Shield className="h-6 w-6" />}
                                                onClick={() => router.push('/admin/committees')}
                                                colorClass="orange"
                                            />
                                        )}
                                        {perms.canViewLogging && (
                                            <ActionCard
                                                title="Logging"
                                                subtitle="Systeem"
                                                icon={<FileText className="h-6 w-6" />}
                                                onClick={() => router.push('/admin/logging')}
                                                colorClass="red"
                                            />
                                        )}
                                        {perms.canViewSync && ( // Access depends on perm logic, using Sync perm here as proxy for permissions page
                                            <ActionCard
                                                title="Beheer"
                                                subtitle="Permissie"
                                                icon={<Shield className="h-6 w-6" />}
                                                onClick={() => router.push('/admin/permissions')}
                                                colorClass="teal"
                                            />
                                        )}
                                        {perms.isIctMember && (
                                            <ActionCard
                                                title="Config"
                                                subtitle="Debug Status"
                                                icon={<Activity className="h-6 w-6" />}
                                                onClick={() => router.push('/admin/debug-config')}
                                                colorClass="blue"
                                            />
                                        )}
                                        {perms.isIctMember && (
                                            <ActionCard
                                                title="Modus"
                                                subtitle="Test Modus"
                                                icon={<Users className="h-6 w-6" />}
                                                onClick={() => router.push('/admin/impersonate')}
                                                colorClass="orange"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional cards below Snelle Acties */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <ListCard
                                        title="Aankomende Jarigen "
                                        icon={<Cake className="h-5 w-5" />}
                                    >
                                        {stats.upcomingBirthdays.length > 0 ? (
                                            <div className="space-y-3">
                                                {stats.upcomingBirthdays.map(person => (
                                                    <div
                                                        key={person.id}
                                                        className={`flex items-center justify-between p-3 rounded-xl ${person.isToday
                                                            ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600'
                                                            : 'bg-slate-100 dark:bg-slate-700'
                                                            }`}
                                                    >
                                                        <div>
                                                            <p className={`font-semibold ${person.isToday ? 'text-yellow-900 dark:text-yellow-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {person.first_name} {person.tussenvoegsel ? `${person.tussenvoegsel} ` : ''}{person.last_name}
                                                                {person.isToday}
                                                            </p>
                                                            <p className={`text-sm ${person.isToday ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                {formatDate(person.birthday)}
                                                            </p>
                                                        </div>
                                                        <Cake className={`h-5 w-5 ${person.isToday ? 'text-yellow-600 dark:text-yellow-400' : 'text-theme-purple'}`} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 dark:text-slate-400 text-center py-4">Geen jarigen gevonden</p>
                                        )}
                                    </ListCard>
                                </div>
                                <div className="col-span-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                                        {/* Top 3 Sticker Collectors */}
                                        <div className="mt-0">
                                            <ListCard
                                                title="Top 3 Sticker Verzamelaars"
                                                icon={<Award className="h-5 w-5" />}
                                            >
                                                {stats.topStickers.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {stats.topStickers.map((person, index) => (
                                                            <div key={person.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500 dark:bg-yellow-600' : index === 1 ? 'bg-slate-400 dark:bg-slate-500' : 'bg-orange-600 dark:bg-orange-700'}`}>
                                                                        {index + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                                            {person.first_name} {person.tussenvoegsel ? `${person.tussenvoegsel} ` : ''}{person.last_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-2xl font-bold text-theme-purple">{person.count}</span>
                                                                    <Award className="h-5 w-5 text-theme-purple" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">Geen stickers gevonden</p>
                                                )}
                                            </ListCard>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Right side stats */}
                        <div className="space-y-4">
                            {/* Activiteiten aanmeldingen - Now on the right side */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-slate-900 dark:text-white font-bold">Activiteiten aanmeldingen</h3>
                                    </div>
                                    <Activity className="h-6 w-6 text-theme-purple" />
                                </div>
                                <div className="space-y-2">
                                    {stats.latestEventsWithSignups && stats.latestEventsWithSignups.length > 0 ? (
                                        stats.latestEventsWithSignups.map(ev => {
                                            const eventDate = ev.event_date ? new Date(ev.event_date) : null;
                                            const now = new Date();
                                            const isPast = eventDate && eventDate < now;

                                            return (
                                                <button
                                                    key={ev.id}
                                                    type="button"
                                                    onClick={isPast ? undefined : () => router.push(`/admin/activiteiten/${ev.id}/aanmeldingen`)}
                                                    disabled={!!isPast}
                                                    aria-disabled={!!isPast}
                                                    className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition hover:shadow-sm active:scale-[.997] ${isPast
                                                        ? 'bg-slate-200 dark:bg-slate-700/50 opacity-75 cursor-default'
                                                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-600 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="text-sm text-slate-700 dark:text-slate-200 truncate pr-2">{ev.name}</div>
                                                        {isPast && (
                                                            <span className="text-xs bg-slate-400 dark:bg-slate-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                Afgelopen
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-lg font-bold ${isPast ? 'text-slate-500 dark:text-slate-400' : 'text-theme-purple'}`}>
                                                            {ev.signups}
                                                        </span>
                                                        <UserCheck className={`h-4 w-4 ${isPast ? 'text-slate-500 dark:text-slate-400' : 'text-theme-purple'}`} />
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-2">Geen recente activiteiten</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                </div>

                {/* System Health - ICT Only */}
                {perms.isIctMember && (
                    <div className="mt-8">
                        <ListCard
                            title="Systeemstatus"
                            icon={<Activity className="h-5 w-5" />}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
                                        <div>
                                            <p className="font-semibold text-admin">API Status</p>
                                            <p className="text-sm text-admin-muted">Operationeel</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        <div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Recente Fouten</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Laatste 24 uur</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-admin-muted">{stats.systemErrors}</span>
                                </div>
                            </div>
                        </ListCard>
                    </div>
                )}
            </div>
        </>
    );
}
