'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layers,
    Plus
} from 'lucide-react';
import { deleteTripActivity, createTripActivity, updateTripActivity } from '@/server/actions/admin/reis/admin-reis-activities.actions';
import AdminToast from '@/components/ui/admin/AdminToast';

import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminSelect from '@/components/ui/admin/AdminSelect';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

import ReisActivityCard from './ReisActivityCard';
import ReisActivityForm from './ReisActivityForm';
import ReisActivitySignupsModal, { type Signup } from './ReisActivitySignupsModal';

import { type Trip, type TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import { type ActivityOption } from '@/lib/reis';
interface ActivityActionResponse {
    success: boolean;
    error?: string;
    initialData?: Partial<TripActivity>;
}

interface Props {
    initialTrips?: Trip[];
    initialActivities?: TripActivity[];
    initialSelectedTripId?: number;
    initialSignupsByActivity?: Record<number, Signup[]>;
    tripName?: string;
}

export default function ReisActivitiesIsland({
    initialTrips = [],
    initialActivities = [],
    initialSelectedTripId = 0,
    initialSignupsByActivity = {},
    tripName = 'Onbekende reis' }: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [selectedTripId, setSelectedTripId] = useState<number>(initialSelectedTripId);
    const [activities, setActivities] = useState<TripActivity[]>(initialActivities);
    const [signupsByActivity] = useState<Map<number, Signup[]>>(
        () => new Map(Object.entries(initialSignupsByActivity).map(([key, value]) => [Number(key), value]))
    );

    const [, startTransition] = useTransition();
    const [editingActivity, setEditingActivity] = useState<Partial<TripActivity> | null>(null);
    const [viewingSignupsId, setViewingSignupsId] = useState<number | null>(null);

    // Sync when props change (trip switch via URL)
    useEffect(() => {
        setActivities(initialActivities);
        setSelectedTripId(initialSelectedTripId);
    }, [initialActivities, initialSelectedTripId]);

    const handleTripChange = (id: number) => {
        router.push(`/beheer/reis/activiteiten?tripId=${id}`);
    };

    const handleSave = async (formData: FormData, options: ActivityOption[]) => {
        formData.set('options', JSON.stringify(options));

        let res: ActivityActionResponse;
        if (editingActivity?.id) {
            formData.set('id', editingActivity.id.toString());
            res = (await updateTripActivity(formData)) as ActivityActionResponse;
        } else {
            formData.set('trip_id', selectedTripId.toString());
            res = (await createTripActivity(formData)) as ActivityActionResponse;
        }

        if (res.success) {
            showToast(editingActivity?.id ? 'Activiteit bijgewerkt' : 'Activiteit aangemaakt', 'success');
            setEditingActivity(null);
            router.refresh();
        } else {
            showToast(res.error || 'Fout bij opslaan', 'error');
            if (res.initialData) {
                setEditingActivity(res.initialData);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze activiteit wilt verwijderen?')) return;

        startTransition(async () => {
            const res = await deleteTripActivity(id);
            if (res.success) {
                setActivities(prev => prev.filter(a => a.id !== id));
                showToast('Activiteit verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
        });
    };

    // Calculated stats removed since they were unused

    return (
        <>
            {!editingActivity && (
                <AdminToolbar
                    title={`Reis Activiteiten — ${tripName}`}
                    subtitle="Beheer activiteiten en inschrijvingen per activiteit"
                    backHref="/beheer/reis"
                />
            )}
            <div className="admin-container min-h-dvh py-4 md:py-8">
                <div className="w-full">
                    <div className="flex flex-col gap-8">
                        {!editingActivity && (
                            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                                <div className="min-w-60">
                                    <AdminSelect
                                        value={selectedTripId}
                                        onChange={handleTripChange}
                                        options={initialTrips.map(trip => ({
                                            value: trip.id,
                                            label: trip.name || 'Onbekende reis'
                                        }))}
                                        size="sm"
                                    />
                                </div>

                                <button
                                    onClick={() => setEditingActivity({})}
                                    className="beheer-button flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-(--beheer-accent) px-6 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Nieuwe Activiteit</span>
                                </button>
                            </div>
                        )}




                        {editingActivity && (
                            <ReisActivityForm
                                activity={editingActivity}
                                onSave={handleSave}
                                onCancel={() => setEditingActivity(null)}
                                pending={false}
                            />
                        )}

                        {activities.length === 0 && !editingActivity ? (
                            <div className="rounded-3xl border-2 border-dashed border-(--beheer-border)/20 bg-(--beheer-card-bg) py-24 text-center">
                                <Layers className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-10" />
                                <p className="text-base font-semibold text-(--beheer-text-muted) opacity-60">
                                    Nog geen activiteiten voor deze reis
                                </p>
                            </div>
                        ) : (
                            !editingActivity && (
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {activities.map(activity => (
                                        <ReisActivityCard
                                            key={activity.id}
                                            activity={activity}
                                            onEdit={setEditingActivity}
                                            onDelete={(id) => { void handleDelete(id); }}
                                            onViewSignups={setViewingSignupsId}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {viewingSignupsId && (
                            <ReisActivitySignupsModal
                                activityName={activities.find(a => a.id === viewingSignupsId)?.name || ''}
                                options={activities.find(a => a.id === viewingSignupsId)?.options}
                                signups={signupsByActivity.get(viewingSignupsId) ?? []}
                                loading={false}
                                onClose={() => setViewingSignupsId(null)}
                            />
                        )}

                    </div>
                    <AdminToast
                        toast={toast}
                        onClose={hideToast}
                    />
                </div>
            </div>
        </>
    );
}
