import React from 'react';
import {
    Calendar,
    FileText,
    Users,
    Ticket,
    Shield,
    MapPin,
    UserCheck,
    Cake,
    Award,
    Activity,
    Globe,
    Zap,
    Settings,
    Layout,
    ShoppingBag,
    Briefcase
} from 'lucide-react';
import {
    ActionCard
} from './AdminCards';
import { formatDate } from '@/shared/lib/utils/date';
import {
    type DashboardStats,
    type Birthday,
    type RecentActivity,
    type TopSticker
} from "@salvemundi/validations/schema/admin-dashboard.zod";

export function DashboardHub({
    permissions,
    stats
}: {
    permissions: string[];
    stats: DashboardStats;
}) {
    const getGroups = (stats: DashboardStats) => [
        {
            title: "Content",
            icon: <Layout />,
            items: [
                { title: "Activiteiten", value: stats.upcomingEventsCount, icon: <Calendar />, href: "/beheer/activiteiten", colorClass: "purple" as const, disabled: !permissions.includes('activiteiten') },
                { title: "Intro", value: stats.introSignups, icon: <FileText />, href: "/beheer/intro", colorClass: "blue" as const, disabled: !permissions.includes('intro') },
                { title: "Reis", value: stats.reisSignups, icon: <Globe />, href: "/beheer/reis", colorClass: "teal" as const, disabled: !permissions.includes('reis') },
                { title: "Kroegentocht", value: stats.pubCrawlSignups, icon: <Ticket />, href: "/beheer/kroegentocht", colorClass: "orange" as const, disabled: !permissions.includes('kroegentocht') },
            ].filter(i => !i.disabled)
        },
        {
            title: "Beheer",
            icon: <Users />,
            items: [
                { title: "Leden", value: stats.totalMembers, icon: <Users />, href: "/beheer/leden", colorClass: "green" as const, disabled: !permissions.includes('leden') },
                { title: "Commissies", value: "Beheer", icon: <Shield />, href: "/beheer/commissies", colorClass: "orange" as const, disabled: !permissions.includes('commissies') },
                { title: "Stickers", value: "Beheer", icon: <MapPin />, href: "/beheer/stickers", colorClass: "purple" as const, disabled: !permissions.includes('stickers') },
                { title: "Coupons", value: stats.totalCoupons, icon: <Ticket />, href: "/beheer/coupons", colorClass: "amber" as const, disabled: !permissions.includes('coupons') },
                { title: "Webshop", value: "Beheer", icon: <ShoppingBag />, href: "/beheer/webshop", colorClass: "purple" as const, disabled: !permissions.includes('webshop') },
                { title: "Bijbanenbank", value: "Beheer", icon: <Briefcase />, href: "/beheer/bijbanenbank", colorClass: "red" as const, disabled: !permissions.includes('vacatures') },
            ].filter(i => !i.disabled)
        },
        {
            title: "Systeem",
            icon: <Settings />,
            items: [
                { title: "Azure Sync", value: "Beheer", icon: <Zap />, href: "/beheer/sync", colorClass: "blue" as const, disabled: !permissions.includes('sync') },
                { title: "Systeem Status", icon: <Activity />, href: "/beheer/services", colorClass: "blue" as const, disabled: !permissions.includes('services') },
                { title: "Logboek", value: "Bekijken", icon: <FileText />, href: "/beheer/logging", colorClass: "amber" as const, disabled: !permissions.includes('logging') },
                { title: "Test Modus", value: "Start", icon: <UserCheck />, href: "/beheer/impersonate", colorClass: "teal" as const, disabled: !permissions.includes('impersonate') },
            ].filter(i => !i.disabled)
        }
    ];

    const groups = getGroups(stats);
    const hasAnyVisibleSection = groups.some(group => group.items.length > 0);

    interface DashboardItem {
        title: string;
        value?: string | number;
        icon: React.ReactNode;
        href: string;
        colorClass: 'purple' | 'blue' | 'teal' | 'orange' | 'green' | 'amber' | 'red';
        disabled?: boolean;
        subtitle?: string;
    }

    const renderSection = (title: string, items: DashboardItem[], icon: React.ReactNode) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                    <div className="bg-theme-purple/10 p-2 rounded-xl text-theme-purple">
                        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-4 w-4' })}
                    </div>
                    <h2 className="text-base font-semibold text-theme-purple">{title}</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-border-color to-transparent" />
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
            {hasAnyVisibleSection ? (
                groups.map((group, idx) => (
                    <React.Fragment key={idx}>
                        {renderSection(group.title, group.items, group.icon)}
                    </React.Fragment>
                ))
            ) : (
                <div className="bg-bg-soft rounded-2xl border border-border-color/50 p-8 text-center max-w-md mx-auto my-8 shadow-sm">
                    <p className="text-sm font-medium text-text-muted">
                        Er zijn nog geen beheerpagina&apos;s voor de commissies waar je in zit.
                    </p>
                </div>
            )}
        </div>
    );
}

export function BirthdaysList({ data }: { data: Birthday[] }) {
    if (data.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-theme-purple/10 p-2 rounded-xl text-theme-purple">
                    <Cake className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-theme-purple">Aankomende Jarigen</h3>
                <div className="h-px flex-1 bg-linear-to-r from-border-color to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-3">
                {data.map((person) => (
                    <ActionCard
                        key={person.id}
                        title={`${person.first_name} ${person.last_name}`}
                        subtitle={person.isToday ? 'Vandaag jarig!' : formatDate(person.birthday, 'd MMMM')}
                        colorClass={person.isToday ? 'amber' : 'purple'}
                        pulse={person.isToday}
                        icon={<Cake />}
                    />
                ))}
            </div>
        </div>
    );
}

export function TopStickersList({ data }: { data: TopSticker[] }) {
    if (data.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-theme-purple/10 p-2 rounded-xl text-theme-purple">
                    <Award className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-theme-purple">Top Sticker Verzamelaars</h3>
                <div className="h-px flex-1 bg-linear-to-r from-border-color to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-3">
                {data.map((person, i) => (
                    <ActionCard
                        key={person.id}
                        title={`${person.first_name} ${person.last_name}`}
                        value={person.count}
                        colorClass={i === 0 ? 'amber' : 'purple'}
                        icon={<Award />}
                    />
                ))}
            </div>
        </div>
    );
}

export function ActivitySignupsList({ data }: { data: RecentActivity[] }) {
    if (data.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="bg-theme-purple/10 p-2 rounded-xl text-theme-purple">
                    <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-theme-purple">Activiteiten aanmeldingen</h3>
                <div className="h-px flex-1 bg-linear-to-r from-border-color to-transparent" />
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
                        icon={<Activity />}
                    />
                ))}
            </div>
        </div>
    );
}
