import React from 'react';
import { 
    Calendar, 
    FileText, 
    Users, 
    Ticket, 
    Shield, 
    MapPin, 
    Mail, 
    UserCheck,
    Cake,
    Award,
    Activity,
    Globe,
    Zap,
    Settings,
    Layout
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
    ActionCard,
    ListCard 
} from './AdminCards';
import { formatDate } from '@/shared/lib/utils/date';
import { 
    getDashboardStats, 
    getUpcomingBirthdays, 
    getRecentActivities, 
    getTopStickers, 
    getDashboardPermissions 
} from '@/server/actions/admin.actions';

/**
 * Universal Dashboard Hub.
 * Standardized across all sections to use the horizontal "Small Button" layout.
 * Organized into 2 columns as requested.
 */
/**
 * Universal Dashboard Hub.
 * Standardized across all sections to use the horizontal "Small Button" layout.
 * Organized into 2 columns as requested.
 */
export async function DashboardHub({ 
    isLoading = false,
    permissions: serverPermissions = null
}: { 
    isLoading?: boolean;
    permissions?: any;
}) {
    const permissions = serverPermissions || await getDashboardPermissions();
    
    // Define items in a way that respects permissions for both skeleton and real state
    const getGroups = (stats: any) => [
        {
            title: "Content",
            icon: <Layout />,
            items: [
                { title: "Activiteiten", value: stats.upcomingEventsCount, icon: <Calendar />, subtitle: "Aankomende Events", href: "/beheer/activiteiten", colorClass: "purple" as const },
                { title: "Intro", value: stats.introSignups, icon: <FileText />, subtitle: "Aanmeldingen", href: "/beheer/intro", colorClass: "blue" as const, disabled: !permissions.canAccessIntro },
                { title: "Reis", value: stats.reisSignups, icon: <Globe />, subtitle: "Aanmeldingen", href: "/beheer/reis", colorClass: "teal" as const, disabled: !permissions.canAccessReis },
                { title: "Kroegentocht", value: stats.pubCrawlSignups, icon: <Ticket />, subtitle: "Groepen", href: "/beheer/kroegentocht", colorClass: "orange" as const, disabled: !permissions.canAccessKroegentocht },
            ].filter(i => !i.disabled)
        },
        {
            title: "Beheer",
            icon: <Users />,
            items: [
                { title: "Leden", value: stats.totalMembers, icon: <Users />, subtitle: "Leden", href: "/beheer/leden", colorClass: "green" as const, disabled: !permissions.canAccessMembers },
                { title: "Commissies", value: "Beheer", icon: <Shield />, subtitle: "Vereniging", href: "/beheer/vereniging", colorClass: "orange" as const, disabled: !permissions.canAccessSync },
                { title: "Stickers", value: "Beheer", icon: <MapPin />, subtitle: "Verzameling", href: "/beheer/stickers", colorClass: "purple" as const, disabled: !permissions.canAccessStickers },
                { title: "Coupons", value: stats.totalCoupons, icon: <Ticket />, subtitle: "Actieve Codes", href: "/beheer/coupons", colorClass: "amber" as const, disabled: !permissions.canAccessCoupons },
            ].filter(i => !i.disabled)
        },
        {
            title: "Systeem",
            icon: <Settings />,
            items: [
                { title: "Azure Sync", value: "Beheer", icon: <Zap />, subtitle: "Azure AD", href: "/beheer/sync", colorClass: "blue" as const, disabled: !permissions.canAccessSync },
                { title: "Mail", value: "Beheer", icon: <Mail />, subtitle: "Mailinglijsten", href: "/beheer/mail", colorClass: "purple" as const, disabled: !permissions.canAccessMail },
                { title: "Logboek", value: "Bekijken", icon: <FileText />, subtitle: "Activiteiten", href: "/beheer/logging", colorClass: "amber" as const, disabled: !permissions.canAccessLogging },
                { title: "Test Modus", value: "Inschakelen", icon: <UserCheck />, subtitle: "Impersonatie", href: "/beheer/impersonate", colorClass: "teal" as const, disabled: !permissions.isIct },
            ].filter(i => !i.disabled)
        }
    ];

    // Return early with skeleton items if loading
    if (isLoading) {
        const dummyStats = { upcomingEventsCount: 0, introSignups: 0, reisSignups: 0, pubCrawlSignups: 0, totalMembers: 0, totalCoupons: 0 };
        const groups = getGroups(dummyStats);

        return (
            <div className="space-y-12">
                {groups.map((group, idx) => (
                    group.items.length > 0 && (
                        <RenderSkeletonSection key={idx} title={group.title} icon={group.icon} count={group.items.length} />
                    )
                ))}
            </div>
        );
    }

    const stats = await getDashboardStats();
    const groups = getGroups(stats);

    const renderSection = (title: string, items: any[], icon: React.ReactNode) => {
        if (items.length === 0) return null;

        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                    <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)] transition-transform group-hover:scale-110">
                        {React.cloneElement(icon as any, { className: 'h-4 w-4' })}
                    </div>
                    <h2 className="text-sm font-black text-[var(--beheer-text)] tracking-[0.2em]">{title}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, i) => (
                        <ActionCard 
                            key={i} 
                            title={item.title}
                            subtitle={item.subtitle}
                            value={item.value !== "Beheer" && item.value !== "Bekijken" && item.value !== "Inschakelen" ? item.value : undefined}
                            icon={item.icon}
                            href={item.href}
                            colorClass={item.colorClass}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12">
            {groups.map((group, idx) => (
                <React.Fragment key={idx}>
                    {renderSection(group.title, group.items, group.icon)}
                </React.Fragment>
            ))}
        </div>
    );
}

/**
 * Skeleton helper for DashboardHub.
 */
function RenderSkeletonSection({ title, icon, count }: { title: string, icon: React.ReactNode, count: number }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)] opacity-40">
                    {React.cloneElement(icon as any, { className: 'h-4 w-4' })}
                </div>
                <h2 className="text-sm font-black text-[var(--beheer-text)] tracking-[0.2em] opacity-40">{title}</h2>
                <div className="h-px flex-1 bg-[var(--beheer-border)] opacity-10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(count)].map((_, i) => (
                    <ActionCard key={i} isLoading={true} />
                ))}
            </div>
        </div>
    );
}

/**
 * Vertical list showing upcoming birthdays.
 */
export async function BirthdaysList({ isLoading = false }: { isLoading?: boolean }) {
    const upcomingBirthdays = isLoading ? [] : await getUpcomingBirthdays();

    return (
        <ListCard title="Aankomende Jarigen" icon={<Cake className="h-5 w-5" />} isLoading={isLoading}>
            {isLoading ? (
                <div className="space-y-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-2 w-16 opacity-50" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : upcomingBirthdays.length > 0 ? (
                <div className="space-y-1">
                    {upcomingBirthdays.map((person) => (
                        <div key={person.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-all hover:bg-[var(--beheer-accent)]/5 group ${person.isToday ? 'bg-amber-500/5 border border-amber-500/20' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${person.isToday ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)]'}`}>
                                    {person.first_name?.[0]}
                                </div>
                                <div>
                                    <p className={`text-xs font-black tracking-tight ${person.isToday ? 'text-amber-600' : 'text-[var(--beheer-text)]'}`}>
                                        {person.first_name} {person.last_name}
                                    </p>
                                    <p className="text-[9px] font-bold tracking-widest text-[var(--beheer-text-muted)] opacity-60">
                                        {person.isToday ? '🎉 Vandaag!' : formatDate(person.birthday)}
                                    </p>
                                </div>
                            </div>
                            {person.isToday && <Cake className="h-4 w-4 text-amber-500 animate-bounce" />}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[var(--beheer-text-muted)] text-[10px] font-black tracking-widest text-center py-8 italic opacity-40">Geen jarigen deze week</p>
            )}
        </ListCard>
    );
}

/**
 * Top sticker collectors rankings.
 */
export async function TopStickersList({ isLoading = false }: { isLoading?: boolean }) {
    const topStickers = isLoading ? [] : await getTopStickers();

    return (
        <ListCard title="Top Sticker Verzamelaars" icon={<Award className="h-5 w-5" />} isLoading={isLoading}>
            {isLoading ? (
                <div className="space-y-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : topStickers.length > 0 ? (
                <div className="space-y-1">
                    {topStickers.map((person, index) => (
                        <div key={person.id} className="flex items-center justify-between p-3.5 hover:bg-[var(--beheer-accent)]/5 rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform ${index === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-600 text-white' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)]'}`}>
                                    {index + 1}
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-black text-[var(--beheer-text)] tracking-tight truncate group-hover:text-[var(--beheer-accent)]">
                                        {person.first_name} {person.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                <span className="text-lg font-black text-[var(--beheer-text)] tracking-tighter leading-tight">{person.count}</span>
                                <MapPin className="h-3 w-3 text-[var(--beheer-accent)]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[var(--beheer-text-muted)] text-[10px] font-black tracking-widest text-center py-8 italic opacity-40">Geen stickers gevonden</p>
            )}
        </ListCard>
    );
}

/**
 * Activity signups overview.
 */
export async function ActivitySignupsList({ isLoading = false }: { isLoading?: boolean }) {
    const latestEventsWithSignups = isLoading ? [] : await getRecentActivities();

    return (
        <ListCard title="Activiteiten aanmeldingen" icon={<Activity className="h-5 w-5" />} isLoading={isLoading}>
            {isLoading ? (
                <div className="space-y-1">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-2 w-20 opacity-50" />
                            </div>
                            <div className="shrink-0">
                                <Skeleton className="h-6 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-1">
                {latestEventsWithSignups.length > 0 ? (
                    latestEventsWithSignups.map((ev) => {
                        const eventDate = ev.event_date ? new Date(ev.event_date) : null;
                        const now = new Date();
                        const isPast = eventDate && eventDate.getTime() < now.getTime();

                        return (
                            <a
                                key={ev.id}
                                href={`/beheer/activiteiten/${ev.id}/aanmeldingen`}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all group border border-transparent hover:bg-[var(--beheer-accent)]/5 hover:border-[var(--beheer-border)] cursor-pointer active:scale-[0.98]"
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-[var(--beheer-text)] tracking-tight truncate group-hover:text-[var(--beheer-accent)]">
                                            {ev.name}
                                        </p>
                                        {isPast && <span className="text-[7px] font-black bg-[var(--beheer-border)] text-[var(--beheer-text-muted)] px-1.5 py-0.5 rounded-full tracking-widest opacity-60">Verleden</span>}
                                    </div>
                                    <p className="text-[9px] font-bold text-[var(--beheer-text-muted)] tracking-widest opacity-60">
                                        {ev.event_date ? formatDate(ev.event_date) : 'Geen datum'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-black tracking-tighter text-[var(--beheer-text)]">{ev.signups}</span>
                                            <Users className="h-3 w-3 text-[var(--beheer-text-muted)] opacity-40" />
                                        </div>
                                    </div>
                                    <div className="bg-[var(--beheer-card-soft)] p-1.5 rounded-lg text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] group-hover:bg-[var(--beheer-accent)]/10 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
                                        <Ticket className="h-3 w-3" />
                                    </div>
                                </div>
                            </a>
                        );
                    })
                ) : (
                    <p className="text-[var(--beheer-text-muted)] text-[10px] font-black tracking-widest text-center py-8 italic opacity-40">Geen recente activiteiten</p>
                )}
            </div>
            )}
        </ListCard>
    );
}
