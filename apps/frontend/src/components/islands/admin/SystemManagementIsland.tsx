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
import { formatDate } from '@/shared/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface Props {
    initialStatuses?: ServiceStatus[];
    initialAutomationSettings?: AutomationSetting[];
}

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
        } catch (_error) {

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
        } catch {
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
        if (status === 'online') return <CheckCircle2 className="h-5 w-5" />;
        if (status === 'degraded') return <AlertCircle className="h-5 w-5" />;
        return <XCircle className="h-5 w-5" />;
    };

    return (
        <div className="w-full">
            <div className="flex flex-col gap-8">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex bg-[var(--beheer-card-soft)] p-1.5 rounded-2xl border border-[var(--beheer-border)] gap-1 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('status')}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2.5 text-[10px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5",
                                activeTab === 'status'
                                    ? "bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm border border-[var(--beheer-border)]"
                                    : "text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]/40"
                            )}
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Status
                        </button>
                        <button
                            onClick={() => setActiveTab('automation')}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2.5 text-[10px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5",
                                activeTab === 'automation'
                                    ? "bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm border border-[var(--beheer-border)]"
                                    : "text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]/40"
                            )}
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            Automatisering
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            void fetchStatus();
                        }}
                        disabled={isRefreshing}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-2xl text-[10px] font-semibold hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                        Update Status
                    </button>
                </div>

                {activeTab === 'status' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {statuses.length === 0 ? (
                            <div className="md:col-span-2 flex flex-col items-center justify-center py-20 bg-[var(--beheer-card-bg)] rounded-[2.5rem] border border-[var(--beheer-border)] border-dashed">
                                <AlertCircle className="h-12 w-12 text-[var(--beheer-text-muted)] opacity-20 mb-4" />
                                <p className="text-sm font-semibold text-[var(--beheer-text-muted)]">Geen status data beschikbaar</p>
                            </div>
                        ) : (
                            statuses.map((service) => (
                                <div
                                    key={service.name}
                                    className="bg-[var(--beheer-card-bg)] rounded-[2.5rem] p-8 border border-[var(--beheer-border)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-[var(--beheer-card-soft)] rounded-2xl text-[var(--beheer-accent)] group-hover:scale-110 transition-transform">
                                            {service.name.toLowerCase().includes('database') ? <Database className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-semibold",
                                            getStatusColor(service.status)
                                        )}>
                                            {getStatusIcon(service.status)}
                                            {service.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--beheer-text)]">{service.name}</h3>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--beheer-text-muted)]">
                                                    <Clock className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                                                    {service.latency ? `${service.latency}ms` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {service.error && (
                                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                                <p className="text-[10px] font-semibold text-rose-500">Error Detail</p>
                                                <p className="text-xs font-semibold text-rose-400/80 mt-1">{service.error}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                        <Activity className="h-48 w-48" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {automationSettings.map((setting) => (
                            <div
                                key={setting.id}
                                className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl transition-all group-hover:scale-110",
                                            setting.isActive
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-rose-500/10 text-rose-500"
                                        )}>
                                            {setting.id === 'mail_expiry_check' ? <CalendarClock className="h-6 w-6" /> :
                                                setting.id === 'auto_sync_nightly' ? <RefreshCcw className="h-6 w-6" /> :
                                                    <BellRing className="h-6 w-6" />}
                                        </div>
                                        <h3 className="font-semibold text-base text-[var(--beheer-text)]">
                                            {setting.name}
                                        </h3>
                                    </div>
                                    <p className="text-[var(--beheer-text-muted)] text-xs mb-8 leading-relaxed font-medium opacity-80">
                                        {setting.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-[var(--beheer-border)]/50">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
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

                        <div className="md:col-span-2 p-8 bg-[var(--beheer-accent)]/5 border border-[var(--beheer-accent)]/20 rounded-[2.5rem] relative overflow-hidden">
                            <div className="flex items-start gap-6 relative z-10">
                                <div className="p-3 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)]">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[var(--beheer-accent)] mb-3">Systeem Veiligheids Protocol</h4>
                                    <p className="text-[var(--beheer-text-muted)] text-xs leading-relaxed max-w-3xl font-medium opacity-90">
                                        Deze toggles beheren kritieke achtergrondprocessen. Wijzigingen treden onmiddellijk in werking.
                                        De **Nachtelijke Sync** draait dagelijks om 03:00 en zorgt dat alle Azure-rechten in de cockpit up-to-date zijn.
                                        Schakel processen alleen uit bij onderhoud of debugging om data-inconsistentie te voorkomen.
                                    </p>
                                </div>
                            </div>
                            <Activity className="absolute -right-8 -bottom-8 h-40 w-40 text-[var(--beheer-accent)] opacity-[0.05]" />
                        </div>
                    </div>
                )}
            </div>

            {lastUpdated && (
                <div className="mt-12 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-40">
                        System Monitoring Active
                    </p>
                    <p className="text-[9px] font-semibold text-[var(--beheer-text-muted)] opacity-30">
                        {`Last Sync: ${formatDate(lastUpdated, 'dd-MM-yyyy HH:mm')}`}
                    </p>
                </div>
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}