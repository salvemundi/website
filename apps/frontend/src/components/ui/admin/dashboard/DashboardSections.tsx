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
 * Modernized: No manual skeleton sections. Uses .skeleton-active on real cards.
 */
export async function DashboardHub({ 
    isLoading = false,
    permissions: serverPermissions = null
}: { 
    isLoading?: boolean;
    permissions?: any;
}) {
    const permissions = serverPermissions || (isLoading ? {} : await getDashboardPermissions());
    
    const getGroups = (stats: any | null) => [
        {
            title: "Content",
            icon: <Layout />,
            items: [
                { title: "Activiteiten", value: stats?.upcomingEventsCount ?? '0', icon: <Calendar />, subtitle: "Aankomende Events", href: "/beheer/activiteiten", colorClass: "purple" as const },
                { title: "Intro", value: stats?.introSignups ?? '0', icon: <FileText />, subtitle: "Aanmeldingen", href: "/beheer/intro", colorClass: "blue" as const, disabled: !permissions.canAccessIntro },
                { title: "Reis", value: stats?.reisSignups ?? '0', icon: <Globe />, subtitle: "Aanmeldingen", href: "/beheer/reis", colorClass: "teal" as const, disabled: !permissions.canAccessReis },
                { title: "Kroegentocht", value: stats?.pubCrawlSignups ?? '0', icon: <Ticket />, subtitle: "Groepen", href: "/beheer/kroegentocht", colorClass: "orange" as const, disabled: !permissions.canAccessKroegentocht },
            ].filter(i => !i.disabled)
        },
        {
            title: "Beheer",
            icon: <Users />,
            items: [
                { title: "Leden", value: stats?.totalMembers ?? '0', icon: <Users />, subtitle: "Leden", href: "/beheer/leden", colorClass: "green" as const, disabled: !permissions.canAccessMembers },
                { title: "Commissies", value: "Beheer", icon: <Shield />, subtitle: "Vereniging", href: "/beheer/vereniging", colorClass: "orange" as const, disabled: !permissions.canAccessSync },
                { title: "Stickers", value: "Beheer", icon: <MapPin />, subtitle: "Verzameling", href: "/beheer/stickers", colorClass: "purple" as const, disabled: !permissions.canAccessStickers },
                { title: "Coupons", value: stats?.totalCoupons ?? '0', icon: <Ticket />, subtitle: "Codes", href: "/beheer/coupons", colorClass: "amber" as const, disabled: !permissions.canAccessCoupons },
            ].filter(i => !i.disabled)
        },
        {
            title: "Systeem",
            icon: <Settings />,
            items: [
                { title: "Azure Sync", value: "Beheer", icon: <Zap />, subtitle: "Azure AD", href: "/beheer/sync", colorClass: "blue" as const, disabled: !permissions.canAccessSync },
                { title: "Mail", value: "Beheer", icon: <Mail />, subtitle: "Mails", href: "/beheer/mail", colorClass: "purple" as const, disabled: !permissions.canAccessMail },
                { title: "Logboek", value: "Bekijken", icon: <FileText />, subtitle: "Audit Logs", href: "/beheer/logging", colorClass: "amber" as const, disabled: !permissions.canAccessLogging },
                { title: "Test Modus", value: "Start", icon: <UserCheck />, subtitle: "Impersonatie", href: "/beheer/impersonate", colorClass: "teal" as const, disabled: !permissions.isIct },
            ].filter(i => !i.disabled)
        }
    ];

    const stats = isLoading ? null : await getDashboardStats();
    const groups = getGroups(stats);

    const renderSection = (title: string, items: any[], icon: React.ReactNode) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                    <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                        {React.cloneElement(icon as any, { className: 'h-4 w-4' })}
                    </div>
                    <h2 className="text-sm font-black text-[var(--beheer-text)] tracking-[0.2em]">{title}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, i) => (
                        <ActionCard 
                            key={i} 
                            isLoading={isLoading}
                            title={item.title}
                            subtitle={item.subtitle}
                            value={item.value !== "Beheer" && item.value !== "Bekijken" && item.value !== "Start" ? item.value : undefined}
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
 * Vertical list showing upcoming birthdays.
 * Modernized: Integrated .skeleton-active standard.
 */
export async function BirthdaysList({ isLoading = false }: { isLoading?: boolean }) {
    const upcomingBirthdays = isLoading ? [] : await getUpcomingBirthdays();

    return (
        <ListCard title="Aankomende Jarigen" icon={<Cake className="h-5 w-5" />} isLoading={isLoading}>
            {(isLoading ? [...Array(5)] : upcomingBirthdays).map((person, i) => (
                <div key={isLoading ? i : person.id} 
                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all hover:bg-[var(--beheer-accent)]/5 group ${person?.isToday ? 'bg-amber-500/5 border border-amber-500/20' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${person?.isToday ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)]'}`}>
                            {isLoading ? '' : person.first_name?.[0]}
                        </div>
                        <div>
                            <p className={`text-xs font-black tracking-tight ${person?.isToday ? 'text-amber-600' : 'text-[var(--beheer-text)]'}`}>
                                {isLoading ? 'Loading Name...' : `${person.first_name} ${person.last_name}`}
                            </p>
                            <p className="text-[9px] font-bold tracking-widest text-[var(--beheer-text-muted)] opacity-60">
                                {isLoading ? 'Loading Date...' : (person.isToday ? '🎉 Vandaag!' : formatDate(person.birthday))}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
            {!isLoading && upcomingBirthdays.length === 0 && (
                <p className="text-[var(--beheer-text-muted)] text-[10px] font-black tracking-widest text-center py-8 italic opacity-40">Geen jarigen</p>
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
            {(isLoading ? [...Array(3)] : topStickers).map((person, i) => (
                <div key={isLoading ? i : person.id} className="flex items-center justify-between p-3.5 hover:bg-[var(--beheer-accent)]/5 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)]'}`}>
                            {i + 1}
                        </div>
                        <p className="text-xs font-black text-[var(--beheer-text)] tracking-tight truncate">
                            {isLoading ? 'Loading Participant...' : `${person.first_name} ${person.last_name}`}
                        </p>
                    </div>
                    {!isLoading && (
                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                            <span className="text-lg font-black text-[var(--beheer-text)] tracking-tighter">{person.count}</span>
                            <MapPin className="h-3 w-3 text-[var(--beheer-accent)]" />
                        </div>
                    )}
                </div>
            ))}
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
            {(isLoading ? [...Array(4)] : latestEventsWithSignups).map((ev, i) => (
                <div key={isLoading ? i : ev.id} className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all group">
                    <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-black text-[var(--beheer-text)] tracking-tight truncate">
                            {isLoading ? 'Loading Activity...' : ev.name}
                        </p>
                        <p className="text-[9px] font-bold text-[var(--beheer-text-muted)] tracking-widest opacity-60">
                            {isLoading ? 'Loading Date...' : (ev.event_date ? formatDate(ev.event_date) : '')}
                        </p>
                    </div>
                    {!isLoading && (
                        <div className="flex items-center gap-1">
                            <span className="text-lg font-black tracking-tighter">{ev.signups}</span>
                            <Users className="h-3 w-3 text-[var(--beheer-text-muted)] opacity-40" />
                        </div>
                    )}
                </div>
            ))}
        </ListCard>
    );
}
