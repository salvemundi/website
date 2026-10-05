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
import { toggleAutomationSetting, type AutomationSetting } from '@/server/actions/beheer/services/beheer-automation.actions';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
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
        if (status === 'online') return 'badge-success';
        if (status === 'degraded') return 'badge-status border-amber-500/30 bg-amber-500/10 text-geel';
        return 'badge-danger';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'online') return <CheckCircle2 className="size-5" />;
        if (status === 'degraded') return <AlertCircle className="size-5" />;
        return <XCircle className="size-5" />;
    };

    return (
        <div className="w-full">
            <div className="flex flex-col gap-8">
                <div className="page-header-row">
                    <div className="tab-bar-container sm:w-auto">
                        <button
                            onClick={() => setActiveTab('status')}
                            className={cn(
                                "flex-1 px-6 py-2.5 sm:flex-none",
                                activeTab === 'status'
                                    ? "tab-button-active"
                                    : "tab-button-inactive"
                            )}
                            type="button">
                            <Activity className="size-3.5" />
                            Status
                        </button>
                        <button
                            onClick={() => setActiveTab('automation')}
                            className={cn(
                                "flex-1 px-6 py-2.5 sm:flex-none",
                                activeTab === 'automation'
                                    ? "tab-button-active"
                                    : "tab-button-inactive"
                            )}
                            type="button">
                            <Settings2 className="size-3.5" />
                            Automatisering
                        </button>
                    </div>

                    <button
                        onClick={() => { void fetchStatus(); }}
                        disabled={isRefreshing}
                        className="beheer-button-secondary"
                        type="button">
                        <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
                        Update Status
                    </button>
                </div>

                {activeTab === 'status' ? (
                    <div className="form-grid-2col">
                        {statuses.length === 0 ? (
                            <div className="empty-state-box py-20 md:col-span-2">
                                <AlertCircle className="empty-state-icon" />
                                <p className="text-sm font-semibold text-(--beheer-text-muted)">Geen status data beschikbaar</p>
                            </div>
                        ) : (
                            statuses.map((service) => (
                                <div
                                    key={service.name}
                                    className="beheer-card-interactive"
                                >
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className="icon-box">
                                            {service.name.toLowerCase().includes('database') ? <Database className="size-6" /> : <Zap className="size-6" />}
                                        </div>
                                        <div className={cn(
                                            "badge-status",
                                            getStatusColor(service.status)
                                        )}>
                                            {getStatusIcon(service.status)}
                                            {service.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-(--beheer-text)">{service.name}</h3>
                                            <div className="mt-3 flex flex-wrap gap-4">
                                                <div className="flex gap-2 form-label-muted">
                                                    <Clock className="size-3.5 text-(--beheer-accent)" />
                                                    Latency: {service.latency ? `${service.latency}ms` : 'N/A'}
                                                </div>
                                                
                                                {service.status !== 'online' && service.outageStart && (
                                                    <div className="flex gap-2 form-label-muted text-theme-error">
                                                        Offline sinds: {formatDateTime(new Date(service.outageStart))}
                                                    </div>
                                                )}
                                                
                                                {service.status === 'online' && service.lastOffline && (
                                                    <div className="flex gap-2 form-label-muted">
                                                        Laatst offline: {formatDateTime(new Date(service.lastOffline))}
                                                    </div>
                                                )}
                                                
                                                {service.status === 'online' && !service.lastOffline && (
                                                    <div className="flex gap-2 form-label-muted text-theme-success">
                                                        Geen downtime geregistreerd
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {service.error && (
                                            <div className={service.status === 'online' ? "beheer-info-box p-4" : "status-callout-error"}>
                                                <p className={cn(
                                                    "text-xs font-semibold",
                                                    service.status === 'online' ? "text-(--beheer-text-muted)" : "text-theme-error"
                                                )}>
                                                    {service.status === 'online' ? 'Laatste Foutmelding' : 'Foutmelding Detail'}
                                                </p>
                                                <p className={cn(
                                                    "mt-1 text-xs font-semibold",
                                                    service.status === 'online' ? "text-(--beheer-text)/70" : "text-theme-error"
                                                )}>{service.error}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-watermark-icon">
                                        <Activity className="size-48" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="form-grid-2col">
                        {automationSettings.map((setting) => (
                            <div
                                key={setting.id}
                                className="beheer-card-interactive flex flex-col justify-between"
                            >
                                <div>
                                    <div className="mb-6 flex items-center gap-4">
                                        <div className={setting.isActive ? "icon-box-active" : "icon-box-error"}>
                                            {setting.id === 'mail_expiry_check' ? <CalendarClock className="size-6" /> :
                                                setting.id === 'auto_sync_nightly' ? <RefreshCcw className="size-6" /> :
                                                    <BellRing className="size-6" />}
                                        </div>
                                        <h3 className="text-base font-semibold text-(--beheer-text)">
                                            {setting.name}
                                        </h3>
                                    </div>
                                    <p className="card-subtext-muted mb-8 opacity-80">
                                        {setting.description}
                                    </p>
                                </div>

                                <div className="status-indicator-row">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-2 rounded-full",
                                            setting.isActive ? "bg-theme-success" : "bg-theme-error"
                                        )} />
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            setting.isActive ? "text-theme-success" : "text-theme-error"
                                        )}>
                                            {setting.isActive ? 'Actief' : 'Gepauzeerd'}
                                        </span>
                                    </div>
                                    <BeheerVisibilityToggle
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

                        <div className="relative beheer-accent-banner overflow-hidden md:col-span-2">
                            <div className="banner-content-wrapper">
                                <div className="icon-box">
                                    <ShieldCheck className="size-8" />
                                </div>
                                <div>
                                    <h4 className="mb-3 section-title-sm text-beheer-accent">Systeem Veiligheids Protocol</h4>
                                    <p className="card-subtext-muted max-w-3xl opacity-90">
                                        Deze toggles beheren kritieke achtergrondprocessen. Wijzigingen treden onmiddellijk in werking.
                                        De <strong>Nachtelijke Sync</strong> draait dagelijks om 03:00 en zorgt dat alle Azure-rechten in de cockpit up-to-date zijn.
                                        Schakel processen alleen uit bij onderhoud of debugging om data-inconsistentie te voorkomen.
                                    </p>
                                </div>
                            </div>
                            <Activity className="bg-watermark-icon size-40 text-beheer-accent" />
                        </div>
                    </div>
                )}
            </div>

            {lastUpdated && (
                <div className="mt-12 flex flex-col items-center">
                    <p className="text-xs font-semibold text-beheer-text-muted opacity-40">
                        System Monitoring Active
                    </p>
                    <p className="system-status-timestamp">
                        {`Last Sync: ${formatDateTime(lastUpdated)}`}
                    </p>
                </div>
            )}

            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}