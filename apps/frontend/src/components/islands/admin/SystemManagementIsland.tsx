'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    CheckCircle2,
    AlertCircle,
    Zap,
    RefreshCw,
    ShieldCheck,
    Clock,
    XCircle,
    CalendarClock,
    BellRing,
    Settings2,
    Database,
    RefreshCcw
} from 'lucide-react';
import { getServicesStatusAction, type ServiceStatus } from '@/server/actions/infrastructure/services-status.actions';
import { toggleAutomationSetting, type AutomationSetting } from '@/server/actions/admin/admin-automation.actions';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { cn } from '@/lib/utils/cn';
import { safeConsoleError } from '@/server/utils/logger';

interface Props {
    initialStatuses?: ServiceStatus[];
    initialAutomationSettings?: AutomationSetting[];
}

const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export default function SystemManagementIsland({
    initialStatuses = [],
    initialAutomationSettings = []
}: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [statuses, setStatuses] = useState<ServiceStatus[]>(initialStatuses);
    const [automationSettings, setAutomationSettings] = useState<AutomationSetting[]>(initialAutomationSettings);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(initialStatuses.length > 0 ? new Date() : null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'status' | 'automation'>('status');

    const fetchStatus = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await getServicesStatusAction();
            setStatuses(data);
            setLastUpdated(new Date());
        } catch (error) {
            safeConsoleError('[SystemManagementIsland.tsx][SystemManagementIsland] ', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            void fetchStatus();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleToggleAutomation = async (key: string) => {
        setTogglingId(key);
        try {
            const res = await toggleAutomationSetting(key);
            if (res.success) {
                setAutomationSettings(prev => prev.map(s =>
                    s.id === key ? { ...s, isActive: !s.isActive } : s
                ));
                const setting = automationSettings.find(s => s.id === key);
                showToast(`${setting?.name} is nu ${!setting?.isActive ? 'ingeschakeld' : 'uitgeschakeld'}`, 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
        } catch (error) {
            safeConsoleError('[SystemManagementIsland.tsx][SystemManagementIsland] ', error);
            showToast('Er is een onverwachte fout opgetreden', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'online') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'degraded') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'online') return <CheckCircle2 className="size-5" />;
        if (status === 'degraded') return <AlertCircle className="size-5" />;
        return <XCircle className="size-5" />;
    };

    return (
        <div className="w-full">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="flex w-full gap-1 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-soft) p-1.5 sm:w-auto">
                        <button
                            onClick={() => setActiveTab('status')}
                            className={cn(
                                "tab-button flex flex-1 items-center justify-center gap-2.5 rounded-xl px-6 py-2.5 text-[10px] font-semibold transition-all sm:flex-none",
                                activeTab === 'status'
                                    ? "border border-(--beheer-border) bg-(--beheer-card-bg) text-(--beheer-accent) shadow-sm"
                                    : "text-(--beheer-text-muted) hover:bg-(--beheer-card-bg)/40 hover:text-(--beheer-text)"
                            )}
                        >
                            <Activity className="size-3.5" />
                            Status
                        </button>
                        <button
                            onClick={() => setActiveTab('automation')}
                            className={cn(
                                "tab-button flex flex-1 items-center justify-center gap-2.5 rounded-xl px-6 py-2.5 text-[10px] font-semibold transition-all sm:flex-none",
                                activeTab === 'automation'
                                    ? "border border-(--beheer-border) bg-(--beheer-card-bg) text-(--beheer-accent) shadow-sm"
                                    : "text-(--beheer-text-muted) hover:bg-(--beheer-card-bg)/40 hover:text-(--beheer-text)"
                            )}
                        >
                            <Settings2 className="size-3.5" />
                            Automatisering
                        </button>
                    </div>

                    <button
                        onClick={() => { void fetchStatus(); }}
                        disabled={isRefreshing}
                        className="beheer-button flex items-center justify-center gap-2 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-bg) px-8 py-3 text-[10px] font-semibold text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
                        Update Status
                    </button>
                </div>

                {activeTab === 'status' ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                        {statuses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-(--beheer-border) bg-(--beheer-card-bg) py-20 md:col-span-2">
                                <AlertCircle className="mb-4 size-12 text-(--beheer-text-muted) opacity-20" />
                                <p className="text-sm font-semibold text-(--beheer-text-muted)">Geen status data beschikbaar</p>
                            </div>
                        ) : (
                            statuses.map((service) => (
                                <div
                                    key={service.name}
                                    className="group relative overflow-hidden rounded-[2.5rem] border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className="rounded-2xl bg-(--beheer-card-soft) p-4 text-(--beheer-accent) transition-transform group-hover:scale-110">
                                            {service.name.toLowerCase().includes('database') ? <Database className="size-6" /> : <Zap className="size-6" />}
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-semibold",
                                            getStatusColor(service.status)
                                        )}>
                                            {getStatusIcon(service.status)}
                                            {service.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-(--beheer-text)">{service.name}</h3>
                                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                                                <div className="flex items-center gap-2 text-[10px] font-semibold text-(--beheer-text-muted)">
                                                    <Clock className="size-3.5 text-(--beheer-accent)" />
                                                    Latency: {service.latency ? `${service.latency}ms` : 'N/A'}
                                                </div>
                                                
                                                {service.status !== 'online' && service.outageStart && (
                                                    <div className="flex items-center gap-2 text-[10px] font-semibold text-rose-500">
                                                        Offline sinds: {formatDateTime(new Date(service.outageStart))}
                                                    </div>
                                                )}
                                                
                                                {service.status === 'online' && service.lastOffline && (
                                                    <div className="flex items-center gap-2 text-[10px] font-semibold text-(--beheer-text-muted)">
                                                        Laatst offline: {formatDateTime(new Date(service.lastOffline))}
                                                    </div>
                                                )}
                                                
                                                {service.status === 'online' && !service.lastOffline && (
                                                    <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-500/85">
                                                        Geen downtime geregistreerd
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {service.error && (
                                            <div className={cn(
                                                "rounded-2xl border p-4",
                                                service.status === 'online'
                                                    ? "border-(--beheer-border)/40 bg-(--beheer-card-soft)"
                                                    : "border-rose-500/10 bg-rose-500/5"
                                            )}>
                                                <p className={cn(
                                                    "text-[10px] font-semibold",
                                                    service.status === 'online' ? "text-(--beheer-text-muted)" : "text-rose-500"
                                                )}>
                                                    {service.status === 'online' ? 'Laatste Foutmelding' : 'Foutmelding Detail'}
                                                </p>
                                                <p className={cn(
                                                    "mt-1 text-xs font-semibold",
                                                    service.status === 'online' ? "text-(--beheer-text)/70" : "text-rose-400/80"
                                                )}>{service.error}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="opacity-0.03 group-hover:opacity-0.07 absolute -right-10 -bottom-10 transition-opacity">
                                        <Activity className="size-48" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                        {automationSettings.map((setting) => (
                            <div
                                key={setting.id}
                                className="group flex flex-col justify-between rounded-[2.5rem] border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm transition-all hover:shadow-md"
                            >
                                <div>
                                    <div className="mb-6 flex items-center gap-4">
                                        <div className={cn(
                                            "rounded-2xl p-4 transition-all group-hover:scale-110",
                                            setting.isActive
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-rose-500/10 text-rose-500"
                                        )}>
                                            {setting.id === 'mail_expiry_check' ? <CalendarClock className="size-6" /> :
                                                setting.id === 'auto_sync_nightly' ? <RefreshCcw className="size-6" /> :
                                                    <BellRing className="size-6" />}
                                        </div>
                                        <h3 className="text-base font-semibold text-(--beheer-text)">
                                            {setting.name}
                                        </h3>
                                    </div>
                                    <p className="mb-8 text-xs leading-relaxed font-medium text-(--beheer-text-muted) opacity-80">
                                        {setting.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-(--beheer-border)/50 pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-2 rounded-full",
                                            setting.isActive ? "bg-emerald-500" : "bg-rose-500"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-semibold",
                                            setting.isActive ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {setting.isActive ? 'Actief' : 'Gepauzeerd'}
                                        </span>
                                    </div>
                                    <AdminVisibilityToggle
                                        label="System Toggle"
                                        isVisible={setting.isActive}
                                        onToggle={() => {
                                            void handleToggleAutomation(setting.id);
                                        }}
                                        isPending={togglingId === setting.id}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="relative overflow-hidden rounded-[2.5rem] border border-(--beheer-accent)/20 bg-(--beheer-accent)/5 p-8 md:col-span-2">
                            <div className="relative z-10 flex items-start gap-6">
                                <div className="rounded-2xl bg-(--beheer-accent)/10 p-3 text-(--beheer-accent)">
                                    <ShieldCheck className="size-8" />
                                </div>
                                <div>
                                    <h4 className="mb-3 text-sm font-semibold text-(--beheer-accent)">Systeem Veiligheids Protocol</h4>
                                    <p className="max-w-3xl text-xs leading-relaxed font-medium text-(--beheer-text-muted) opacity-90">
                                        Deze toggles beheren kritieke achtergrondprocessen. Wijzigingen treden onmiddellijk in werking.
                                        De <strong>Nachtelijke Sync</strong> draait dagelijks om 03:00 en zorgt dat alle Azure-rechten in de cockpit up-to-date zijn.
                                        Schakel processen alleen uit bij onderhoud of debugging om data-inconsistentie te voorkomen.
                                    </p>
                                </div>
                            </div>
                            <Activity className="opacity-0.05 absolute -right-8 -bottom-8 size-40 text-(--beheer-accent)" />
                        </div>
                    </div>
                )}
            </div>

            {lastUpdated && (
                <div className="mt-12 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-40">
                        System Monitoring Active
                    </p>
                    <p className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-30">
                        {`Last Sync: ${formatDateTime(lastUpdated)}`}
                    </p>
                </div>
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}