'use client';

import React, { useState, useEffect } from 'react';
import type { Trip, TripSignup, TripSignupActivity, TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import TripFilters from '@/components/admin/reis/TripFilters';
import TripTable from '@/components/admin/reis/TripTable';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { downloadCSV } from '@/lib/utils/export';
import AdminTripSignupModalIsland from './reis/AdminTripSignupModalIsland';
import { getPaymentStatus, getStatusBadge } from '@/lib/reis/trip-admin.utils';
import { generateReisCSVData } from '@/lib/reis/trip-export';
import { useTripActions } from '@/hooks/use-trip-actions';

interface AdminTripTableIslandProps {
    title?: string;
    initialSignups: TripSignup[];
    initialSignupActivities: Record<number, TripSignupActivity[]>;
    allTripActivities: TripActivity[];
    trip: Trip;
}

export default function AdminTripTableIsland({
    initialSignups = [],
    initialSignupActivities = {},
    allTripActivities = [],
    trip
}: AdminTripTableIslandProps) {
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
                <TripFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    roleFilter={roleFilter}
                    onRoleChange={setRoleFilter}
                    onDownloadCSV={downloadCSVExport}
                    tripId={trip.id}
                />

                <TripTable
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
                <AdminTripSignupModalIsland
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

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}