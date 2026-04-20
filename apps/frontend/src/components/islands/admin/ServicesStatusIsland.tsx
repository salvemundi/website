'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Activity, 
    CheckCircle2, 
    AlertCircle, 
    Zap, 
    RefreshCw, 
    ShieldCheck, 
    Server, 
    Clock,
    XCircle
} from 'lucide-react';
import { getServicesStatusAction, type ServiceStatus } from '@/server/actions/services-status.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { formatDate } from '@/shared/lib/utils/date';

interface Props {
    initialStatuses?: ServiceStatus[];
}

export default function ServicesStatusIsland({ 
    initialStatuses = []
}: Props) {
    const [statuses, setStatuses] = useState<ServiceStatus[]>(initialStatuses);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(initialStatuses.length > 0 ? new Date() : null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStatus = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await getServicesStatusAction();
            setStatuses(data);
            setLastUpdated(new Date());
        } catch (err) {
            // Background update errors are handled by data absence
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const getStatusColor = (status: string) => {
        if (status === 'online') return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (status === 'degraded') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'online') return <CheckCircle2 className="h-5 w-5" />;
        if (status === 'degraded') return <AlertCircle className="h-5 w-5" />;
        return <XCircle className="h-5 w-5" />;
    };

    const adminStats = useMemo(() => [
        { 
            label: 'Systemen', 
            value: statuses.length, 
            icon: Server, 
            trend: 'Totaal' 
        },
        { 
            label: 'Gezond', 
            value: statuses.filter(s => s.status === 'online').length, 
            icon: ShieldCheck, 
            trend: 'Healthy' 
        },
        { 
            label: 'Issue', 
            value: statuses.filter(s => s.status !== 'online').length, 
            icon: AlertCircle, 
            trend: 'Errors' 
        },
        { 
            label: 'Uptime', 
            value: '99.9%', 
            icon: Activity, 
            trend: 'Rolling' 
        },
    ], [statuses]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
            <div className="flex justify-end gap-3 mb-8">
                <button
                    onClick={fetchStatus}
                    disabled={isRefreshing}
                    className="flex items-center justify-center gap-2 px-8 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <AdminStatsBar stats={adminStats} />

            {statuses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[var(--beheer-card-bg)] rounded-[2.5rem] border border-[var(--beheer-border)] border-dashed">
                    <AlertCircle className="h-12 w-12 text-[var(--beheer-text-muted)] opacity-20 mb-4" />
                    <p className="text-sm font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Geen status data beschikbaar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {statuses.map((service) => (
                        <div 
                            key={service.name}
                            className="bg-[var(--beheer-card-bg)] rounded-[2.5rem] p-8 border border-[var(--beheer-border)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-[var(--beheer-card-soft)] rounded-2xl text-[var(--beheer-accent)] group-hover:scale-110 transition-transform">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(service.status)}`}>
                                    {getStatusIcon(service.status)}
                                    {service.status}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-widest">{service.name}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                            <Clock className="h-3.5 w-3.5" />
                                            {service.latency ? `${service.latency}ms` : 'N/A'}
                                        </div>
                                        <div className="h-3 w-[1px] bg-[var(--beheer-border)]"></div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                            <Activity className="h-3.5 w-3.5" />
                                            SSL beveiligd
                                        </div>
                                    </div>
                                </div>

                                {service.error && (
                                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Error Detail</p>
                                        <p className="text-xs font-bold text-red-400/80 mt-1">{service.error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Background Pattern */}
                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="h-40 w-40" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {lastUpdated && (
                <p className="mt-8 text-center text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                    {`Laatst gecontroleerd: ${formatDate(lastUpdated!, true)}`}
                </p>
            )}
        </div>
    );
}
