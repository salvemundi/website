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
    type DashboardStats,
    type Birthday,
    type RecentActivity,
    type TopSticker
} from "@salvemundi/validations/schema/admin-dashboard.zod";
import { UserPermissions } from '@/shared/lib/permissions';

/**
 * Universal Dashboard Hub.
 * Modernized: No manual skeleton sections. 100% Data-driven.
 */
export function DashboardHub({ 
    permissions,
    stats
}: { 
    permissions: UserPermissions;
    stats: DashboardStats;
}) {
    const getGroups = (stats: DashboardStats) => [
        {
            title: "Content",
            icon: <Layout />,
            items: [
                { title: "Activiteiten", value: stats?.upcomingEventsCount ?? '0', icon: <Calendar />, href: "/beheer/activiteiten", colorClass: "purple" as const },
                { title: "Intro", value: stats?.introSignups ?? '0', icon: <FileText />, href: "/beheer/intro", colorClass: "blue" as const, disabled: !permissions.canAccessIntro },
                { title: "Reis", value: stats?.reisSignups ?? '0', icon: <Globe />, href: "/beheer/reis", colorClass: "teal" as const, disabled: !permissions.canAccessReis },
                { title: "Kroegentocht", value: stats?.pubCrawlSignups ?? '0', icon: <Ticket />, href: "/beheer/kroegentocht", colorClass: "orange" as const, disabled: !permissions.canAccessKroegentocht },
            ].filter(i => !i.disabled)
        },
        {
            title: "Beheer",
            icon: <Users />,
            items: [
                { title: "Leden", value: stats?.totalMembers ?? '0', icon: <Users />, href: "/beheer/leden", colorClass: "green" as const, disabled: !permissions.canAccessMembers },
                { title: "Commissies", value: "Beheer", icon: <Shield />, href: "/beheer/commissies", colorClass: "orange" as const, disabled: !permissions.canAccessCommittees },
                { title: "Stickers", value: "Beheer", icon: <MapPin />, href: "/beheer/stickers", colorClass: "purple" as const, disabled: !permissions.canAccessStickers },
                { title: "Coupons", value: stats?.totalCoupons ?? '0', icon: <Ticket />, href: "/beheer/coupons", colorClass: "amber" as const, disabled: !permissions.canAccessCoupons },
            ].filter(i => !i.disabled)
        },
        {
            title: "Systeem",
            icon: <Settings />,
            items: [
                { title: "Azure Sync", value: "Beheer", icon: <Zap />, href: "/beheer/sync", colorClass: "blue" as const, disabled: !permissions.canAccessSync },
                { title: "Systeem Status", icon: <Activity />, href: "/beheer/services", colorClass: "blue" as const, disabled: !permissions.isICT },
                { title: "Mail", value: "Beheer", icon: <Mail />, href: "/beheer/mail", colorClass: "purple" as const, disabled: !permissions.canAccessMail },
                { title: "Logboek", value: "Bekijken", icon: <FileText />, href: "/beheer/logging", colorClass: "amber" as const, disabled: !permissions.canAccessLogging },
                { title: "Test Modus", value: "Start", icon: <UserCheck />, href: "/beheer/impersonate", colorClass: "teal" as const, disabled: !permissions.isICT },
            ].filter(i => !i.disabled)
        }
    ];

    const groups = getGroups(stats);

    const renderSection = (title: string, items: any[], icon: React.ReactNode) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                    <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'h-4 w-4' })}
                    </div>
                    <h2 className="text-base font-semibold text-[var(--beheer-text)] tracking-wider">{title}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, i) => (
                        <ActionCard 
                            key={i} 
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
 * Modernized: Pure data rendering, no manual loading states.
 */
export function BirthdaysList({ data }: { data: Birthday[] }) {
    if (data.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                    <Cake className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--beheer-text)] tracking-wider">Aankomende Jarigen</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-3">
                {data.map((person) => (
                    <ActionCard 
                        key={person.id}
                        title={`${person.first_name} ${person.last_name}${person.isToday ? ' 🎂' : ''}`}
                        subtitle={person.isToday ? '🎉 Vandaag!' : formatDate(person.birthday, 'd MMMM')}
                        value={person.isToday ? '🎈' : undefined}
                        colorClass={person?.isToday ? 'amber' : 'purple'}
                        pulse={person?.isToday}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Top sticker collectors rankings.
 */
export function TopStickersList({ data }: { data: TopSticker[] }) {
    if (data.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                    <Award className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--beheer-text)] tracking-wider">Top Sticker Verzamelaars</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-3">
                {data.map((person, i) => (
                    <ActionCard 
                        key={person.id}
                        title={`${person.first_name} ${person.last_name}`}
                        value={person.count}
                        colorClass={i === 0 ? 'amber' : 'purple'}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Activity signups overview.
 */
export function ActivitySignupsList({ data }: { data: RecentActivity[] }) {
    if (data.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                    <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--beheer-text)] tracking-wider">Activiteiten aanmeldingen</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-3">
                {data.map((ev) => (
                    <ActionCard 
                        key={ev.id}
                        title={ev.name}
                        subtitle={ev.event_date ? formatDate(ev.event_date, 'd MMMM yyyy') : undefined}
                        value={ev.signups}
                        href={`/beheer/activiteiten/${ev.id}/aanmeldingen`}
                        colorClass="purple"
                    />
                ))}
            </div>
        </div>
    );
}
