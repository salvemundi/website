'use client';

import React, { useState, useEffect } from 'react';
import type { Trip, TripActivity, TripSignup, TripSignupActivity } from '@salvemundi/validations';
import ReisFilters from '@/components/admin/reis/ReisFilters';
import ReisTable from '@/components/admin/reis/ReisTable';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { downloadCSV } from '@/lib/utils/export';
import BeheerReisSignupModalIsland from './BeheerReisSignupModalIsland';
import { getPaymentStatus, getStatusBadge } from '@/lib/reis/trip-admin.utils';
import { generateReisCSVData } from '@/lib/reis/trip-export';
import { useTripActions } from '@/hooks/use-trip-actions';

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
    const { toast, showToast, hideToast } = useAdminToast();

    const {
        signups,
        sendingEmailTo,
        actionStates,
        isPending,
        handleStatusChange,
        handleDelete,
        handleResendPaymentEmail,
        handleSave: handleSaveAction
    } = useTripActions(initialSignups, trip, showToast);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [mounted, setMounted] = useState(false);
    const [selectedSignupId, setSelectedSignupId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const formRef = React.useRef<HTMLFormElement>(null);

    const selectedSignup = selectedSignupId !== null
        ? signups.find(s => s.id === selectedSignupId) || null
        : null;

    useEffect(() => { setMounted(true); }, []);

    const openSignup = (signup: TripSignup, edit: boolean = false) => {
        setSelectedSignupId(signup.id);
        setIsEditing(edit);
        const activities = initialSignupActivities[signup.id] ?? [];
        setSelectedActivities(activities.map(a => Number(a.trip_activity_id || 0)));
    };

    const handleToggleActivity = (id: number) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const handleSave = (formData: FormData) => {
        if (!selectedSignup) return;
        handleSaveAction(
            selectedSignup.id,
            formData,
            selectedActivities,
            () => {
                setIsEditing(false);
            }
        );
    };

    const handleSaveSync = (formData: FormData) => {
        handleSave(formData);
    };

    const handleStatusChangeSync = (id: number, status: string) => {
        handleStatusChange(id, status);
    };

    const handleDeleteSync = (id: number) => {
        handleDelete(id, () => setSelectedSignupId(null));
    };

    const handleDeleteSelectedSync = () => {
        if (selectedSignup) {
            handleDelete(selectedSignup.id, () => setSelectedSignupId(null));
        }
    };

    const handleResendPaymentEmailSync = (id: number, type: 'deposit' | 'final') => {
        handleResendPaymentEmail(id, type);
    };

    const filteredSignups = signups
        .filter(signup => {
            if (searchQuery) {
                const queryText = searchQuery.toLowerCase();
                const fullName = `${signup.first_name} ${signup.last_name}`.toLowerCase();
                if (!fullName.includes(queryText) && !signup.email.toLowerCase().includes(queryText)) return false;
            }
            if (statusFilter !== 'all' && signup.status !== statusFilter) return false;
            if (roleFilter === 'driver') {
                if (!signup.willing_to_drive) return false;
            } else if (roleFilter !== 'all') {
                if (signup.role !== roleFilter) return false;
            }
            return true;
        })
        .sort((a, b) => b.id - a.id);

    const downloadCSVExport = () => {
        if (filteredSignups.length === 0) return;
        try {
            const csvData = generateReisCSVData(filteredSignups, initialSignupActivities, trip);
            const date = new Date().toISOString().split('T')[0];
            downloadCSV(csvData, `reis-aanmeldingen-${trip.name || 'export'}-${date}.csv`);
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
                    tripId={trip.id}
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
                <BeheerReisSignupModalIsland
                    isOpen={!!selectedSignup}
                    isEditing={isEditing}
                    isPending={isPending}
                    selectedSignup={selectedSignup}
                    trip={trip}
                    allTripActivities={allTripActivities}
                    selectedActivities={selectedActivities}
                    sendingEmailTo={sendingEmailTo}
                    formRef={formRef}
                    onClose={() => isEditing ? setIsEditing(false) : setSelectedSignupId(null)}
                    onToggleEdit={() => setIsEditing(!isEditing)}
                    onDelete={handleDeleteSelectedSync}
                    onSave={handleSaveSync}
                    onToggleActivity={handleToggleActivity}
                    onResendEmail={handleResendPaymentEmailSync}
                />
            )}

            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}