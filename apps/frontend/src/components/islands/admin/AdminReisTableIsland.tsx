'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { format } from 'date-fns';
import type { Trip, TripSignup, TripSignupActivity, TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { updateTripSignup, updateSignupActivities } from '@/server/actions/admin/reis-signups.actions';

import ReisFilters from '@/components/admin/reis/ReisFilters';
import ReisTable from '@/components/admin/reis/ReisTable';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { downloadCSV } from '@/lib/utils/export';
import AdminReisSignupModalIsland from './reis/AdminReisSignupModalIsland';

import { getPaymentStatus, getStatusBadge } from '@/lib/reis/reis-admin.utils';
import { generateReisCSVData } from '@/lib/reis/reis-export';
import { useReisActions } from '@/hooks/use-reis-actions';

interface AdminReisTableIslandProps {
    title?: string;
    initialSignups: TripSignup[];
    initialSignupActivities: Record<number, TripSignupActivity[]>;
    allTripActivities: TripActivity[];
    trip: Trip;
}

export default function AdminReisTableIsland({
    initialSignups = [],
    initialSignupActivities = {},
    allTripActivities = [],
    trip
}: AdminReisTableIslandProps) {
    const [isPending, _startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

    const {
        signups,
        setSignups,
        sendingEmailTo,
        actionStates,
        handleStatusChange,
        handleDelete,
        handleResendPaymentEmail
    } = useReisActions(initialSignups, trip, showToast);

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

    useEffect(() => {
        setSignups(initialSignups);
    }, [initialSignups, setSignups]);

    const openSignup = (signup: TripSignup, edit: boolean = false) => {
        setSelectedSignup(signup);
        setIsEditing(edit);
        const signupActivities = initialSignupActivities as Record<number, TripSignupActivity[] | undefined>;
        const activities = signupActivities[signup.id] || [];
        setSelectedActivities(activities.map(a => {
            const actId = a.trip_activity_id as unknown;
            return actId && typeof actId === 'object' && 'id' in actId
                ? (actId as { id: number }).id
                : Number(actId);
        }));
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

    const handleSaveSync = (formData: FormData) => {
        void handleSave(formData);
    };

    const handleStatusChangeSync = (id: number, status: string) => {
        void handleStatusChange(id, status, (u) => setSelectedSignup(u));
    };

    const handleDeleteSync = (id: number) => {
        void handleDelete(id, () => setSelectedSignup(null));
    };

    const handleDeleteSelectedSync = () => {
        if (selectedSignup) {
            void handleDelete(selectedSignup.id, () => setSelectedSignup(null));
        }
    };

    const handleResendPaymentEmailSync = (id: number, type: 'deposit' | 'final') => {
        void handleResendPaymentEmail(id, type, (u) => setSelectedSignup(u));
    };

    const filteredSignups = signups.filter(signup => {
        if (searchQuery) {
            const queryText = searchQuery.toLowerCase();
            const fullName = `${signup.first_name} ${signup.last_name}`.toLowerCase();
            if (!fullName.includes(queryText) && !signup.email.toLowerCase().includes(queryText)) return false;
        }
        if (statusFilter !== 'all' && signup.status !== statusFilter) return false;
        if (roleFilter !== 'all' && signup.role !== roleFilter) return false;
        return true;
    });

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

    return (
        <div className="w-full">
            <div className="flex flex-col gap-8">
                <ReisFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    roleFilter={roleFilter}
                    onRoleChange={setRoleFilter}
                    onDownloadCSV={downloadCSVExport}
                />

                <ReisTable
                    filteredSignups={filteredSignups}
                    selectedSignupId={selectedSignup?.id || null}
                    onOpenSignup={openSignup}
                    getStatusBadge={getStatusBadge}
                    getPaymentStatus={getPaymentStatus}
                    actionStates={actionStates}
                    sendingEmailTo={sendingEmailTo}
                    onStatusChange={handleStatusChangeSync}
                    onDelete={handleDeleteSync}
                    onResendEmail={handleResendPaymentEmailSync}
                    signupActivitiesMap={initialSignupActivities}
                    allowFinalPayments={!!trip.allow_final_payments}
                    isBusTrip={!!trip.is_bus_trip}
                />
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
                    onDelete={handleDeleteSelectedSync}
                    onSave={handleSaveSync}
                    onToggleActivity={handleToggleActivity}
                    onResendEmail={handleResendPaymentEmailSync}
                />
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
