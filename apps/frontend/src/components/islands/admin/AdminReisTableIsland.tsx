'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import type { Trip, TripSignup, TripSignupActivity, TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { updateTripSignup, updateSignupActivities } from '@/server/actions/admin/reis-signups.actions';
import { Users, UserCheck, UserX, CreditCard, Banknote, Mail, Ticket, Edit2, Download, ChevronDown } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { nl } from 'date-fns/locale';
import ReisFilters from '@/components/admin/reis/ReisFilters';
import ReisTable from '@/components/admin/reis/ReisTable';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { downloadCSV } from '@/lib/utils/export';
import AdminReisSignupModalIsland from './reis/AdminReisSignupModalIsland';

// New Refactored Modules
import { getPaymentStatus, getStatusBadge } from '@/lib/reis-admin.utils';
import { generateReisCSVData } from '@/lib/reis-export';
import { useReisActions } from '@/hooks/use-reis-actions';

interface AdminReisTableIslandProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    initialSignups: TripSignup[];
    initialSignupActivities: Record<number, TripSignupActivity[]>;
    allTripActivities?: TripActivity[];
    trip: Trip;
    trips?: Trip[];
    initialSettings?: { show: boolean };
    stats?: {
        total: number;
        confirmed: number;
        waitlist: number;
        depositPaid: number;
        fullPaid: number;
    }
}

/**
 * AdminReisTableIsland: Beheerpaneel voor reisaanmeldingen.
 * Refactored naar < 300 regels door extractie van acties, export en utils.
 */
export default function AdminReisTableIsland({
    title,
    subtitle,
    backHref,
    initialSignups = [],
    initialSignupActivities = {},
    allTripActivities = [],
    trip,
    trips = [],
    stats
}: AdminReisTableIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, _startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

    // 1. Hook for Signup Actions (Status, Delete, Email)
    const {
        signups,
        setSignups,
        sendingEmailTo,
        actionStates,
        handleStatusChange,
        handleDelete,
        handleResendPaymentEmail
    } = useReisActions(initialSignups, trip, showToast);

    // 2. Local UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [mounted, setMounted] = useState(false);
    const [selectedSignup, setSelectedSignup] = useState<TripSignup | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const formRef = React.useRef<HTMLFormElement>(null);

    useEffect(() => { setMounted(true); }, []);

    // Sync state when initialSignups changes (revalidation)
    useEffect(() => {
        setSignups(initialSignups);
    }, [initialSignups, setSignups]);

    // 3. Selection & Modal Handlers
    const openSignup = (signup: TripSignup, edit: boolean = false) => {
        setSelectedSignup(signup);
        setIsEditing(edit);
        const activities = initialSignupActivities[signup.id] || [];
        setSelectedActivities(activities.map(a => typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id));
    };

    const handleToggleActivity = (id: number) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const handleSave = async (formData: FormData) => {
        if (!selectedSignup) return;
        setIsSaving(true);
        try {
            const res = await updateTripSignup(null, formData);
            if (!res.success) {
                showToast(res.error || 'Fout bij het opslaan', 'error');
                return;
            }

            const actRes = await updateSignupActivities(selectedSignup.id, selectedActivities);
            if (!actRes.success) {
                showToast(actRes.error || 'Fout bij bijwerken activiteiten', 'error');
            }

            showToast('Wijzigingen opgeslagen', 'success');

            const updatedData = Object.fromEntries(formData.entries());
            const id = Number(updatedData.id);

            const updateFunction = (s: TripSignup) => s.id === id ? {
                ...s,
                ...updatedData,
                willing_to_drive: updatedData.willing_to_drive === 'on' || updatedData.willing_to_drive === 'true',
                deposit_paid: updatedData.deposit_paid === 'on' || updatedData.deposit_paid === 'true',
                full_payment_paid: updatedData.full_payment_paid === 'on' || updatedData.full_payment_paid === 'true',
                id: id
            } as TripSignup : s;

            setSignups(prev => prev.map(updateFunction));
            setSelectedSignup(prev => prev ? updateFunction(prev) : null);
            setIsEditing(false);
        } catch {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 4. Filtering & Stats
    const filteredSignups = signups.filter(signup => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const fullName = `${signup.first_name} ${signup.last_name}`.toLowerCase();
            if (!fullName.includes(query) && !signup.email.toLowerCase().includes(query)) return false;
        }
        if (statusFilter !== 'all' && signup.status !== statusFilter) return false;
        if (roleFilter !== 'all' && signup.role !== roleFilter) return false;
        return true;
    });

    const displayStats = [
        { label: 'Aanmeldingen', value: stats?.total || 0, icon: Users },
        { label: 'Wachtlijst', value: stats?.waitlist || 0, icon: UserX },
        { label: 'Bevestigd', value: stats?.confirmed || 0, icon: UserCheck },
        { label: 'Aanbetaling', value: stats?.depositPaid || 0, icon: Banknote },
        { label: 'Volledig', value: stats?.fullPaid || 0, icon: CreditCard }
    ];

    // 5. Export Logic
    const downloadCSVExport = () => {
        if (filteredSignups.length === 0) return;
        try {
            const csvData = generateReisCSVData(filteredSignups, initialSignupActivities, trip);
            downloadCSV(csvData, `reis-aanmeldingen-${trip.name || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            showToast('CSV bestand succesvol gegenereerd', 'success');
        } catch {
            showToast('Export mislukt.', 'error');
        }
    };

    const currentTripId = searchParams.get('tripId');
    const selectedId = currentTripId ? Number(currentTripId) : (trips.length > 0 ? trips[0].id : '');

    return (
        <div className="space-y-4">
            <AdminToolbar
                title={title}
                subtitle={subtitle}
                backHref={backHref}
                actions={
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        <div className="relative group min-w-[180px]">
                            <select
                                value={selectedId}
                                onChange={(e) => router.push(`/beheer/reis${e.target.value ? `?tripId=${e.target.value}` : ''}`)}
                                className="beheer-select w-full pr-8 py-1.5 text-xs font-semibold"
                            >
                                {trips.map(trip => {
                                    const displayStartDate = trip.start_date;
                                    if (!displayStartDate) return <option key={trip.id} value={trip.id}>{trip.name}</option>;

                                    const dateDisplay = trip.end_date
                                        ? `${format(new Date(displayStartDate), 'd MMM', { locale: nl })} - ${format(new Date(trip.end_date), 'd MMM', { locale: nl })}`
                                        : format(new Date(displayStartDate), 'd MMM', { locale: nl });

                                    return (
                                        <option key={trip.id} value={trip.id} className="bg-[var(--beheer-card-bg)] text-[var(--beheer-text)]">
                                            {trip.name} ({dateDisplay})
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--beheer-text-muted)] opacity-40 group-hover:text-[var(--beheer-accent)] transition-colors pointer-events-none" />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => router.push('/beheer/reis/mail')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl squircle text-[11px] font-semibold hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                <Mail className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                                Email
                            </button>

                            <button
                                onClick={() => router.push('/beheer/reis/activiteiten')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-accent)] text-white rounded-xl squircle text-[11px] font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10 whitespace-nowrap"
                            >
                                <Ticket className="h-3.5 w-3.5" />
                                Activiteiten
                            </button>
                            
                            <button
                                onClick={() => router.push('/beheer/reis/instellingen')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl squircle text-[11px] font-semibold hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                Instellingen
                            </button>

                            <button
                                onClick={downloadCSVExport}
                                disabled={filteredSignups.length === 0}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl squircle text-[11px] font-semibold shadow-lg hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50 border border-white/10 whitespace-nowrap"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export
                            </button>
                        </div>
                    </div>
                }
            />

            <div className="admin-container py-4 md:py-8">
                <div className="flex flex-col gap-8">
                    <ReisFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        roleFilter={roleFilter}
                        onRoleChange={setRoleFilter}
                        stats={displayStats}
                    />

                    <ReisTable
                        filteredSignups={filteredSignups}
                        selectedSignupId={selectedSignup?.id || null}
                        onOpenSignup={openSignup}
                        getStatusBadge={getStatusBadge}
                        getPaymentStatus={getPaymentStatus}
                        actionStates={actionStates}
                        sendingEmailTo={sendingEmailTo}
                        onStatusChange={(id, status) => handleStatusChange(id, status, (u) => setSelectedSignup(u))}
                        onDelete={(id) => handleDelete(id, () => setSelectedSignup(null))}
                        onResendEmail={(id, type) => handleResendPaymentEmail(id, type, (u) => setSelectedSignup(u))}
                        signupActivitiesMap={initialSignupActivities}
                        allowFinalPayments={!!trip?.allow_final_payments}
                        isBusTrip={!!trip?.is_bus_trip}
                    />
                </div>
            </div>

            {mounted && (
                <AdminReisSignupModalIsland
                    isOpen={!!selectedSignup}
                    isEditing={isEditing}
                    isPending={isPending || isSaving}
                    selectedSignup={selectedSignup}
                    trip={trip}
                    allTripActivities={allTripActivities}
                    selectedActivities={selectedActivities}
                    sendingEmailTo={sendingEmailTo}
                    formRef={formRef}
                    onClose={() => isEditing ? setIsEditing(false) : setSelectedSignup(null)}
                    onToggleEdit={() => setIsEditing(!isEditing)}
                    onDelete={() => handleDelete(selectedSignup!.id, () => setSelectedSignup(null))}
                    onSave={handleSave as unknown as (formData: FormData) => void}
                    onToggleActivity={handleToggleActivity}
                    onResendEmail={(id, type) => handleResendPaymentEmail(id, type, (u) => setSelectedSignup(u))}
                />
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
