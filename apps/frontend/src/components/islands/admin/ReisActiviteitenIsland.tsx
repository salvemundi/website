'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layers,
    Plus
} from 'lucide-react';
import { deleteTripActivity, createTripActivity, updateTripActivity } from '@/server/actions/admin/reis-activities.actions';
import AdminToast from '@/components/ui/admin/AdminToast';

import { useAdminToast } from '@/hooks/use-admin-toast';

import TripActivityCard from './reis/TripActivityCard';
import TripActivityForm from './reis/TripActivityForm';
import TripActivitySignupsModal, { type Signup } from './reis/TripActivitySignupsModal';

import { type Trip, type TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
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
}

export default function ReisActiviteitenIsland({
    initialTrips = [],
    initialActivities = [],
    initialSelectedTripId = 0,
    initialSignupsByActivity = {} }: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [selectedTripId, setSelectedTripId] = useState<number>(initialSelectedTripId);
    const [activities, setActivities] = useState<TripActivity[]>(initialActivities);
    const [signupsByActivity] = useState<Map<number, Signup[]>>(
        () => new Map(Object.entries(initialSignupsByActivity).map(([k, v]) => [Number(k), v]))
    );

    const [_isPending, startTransition] = useTransition();
    const [editingActivity, setEditingActivity] = useState<Partial<TripActivity> | null>(null);
    const [viewingSignupsId, setViewingSignupsId] = useState<number | null>(null);

    // Sync when props change (trip switch via URL)
    useEffect(() => {
        setActivities(initialActivities);
        setSelectedTripId(initialSelectedTripId);
    }, [initialActivities, initialSelectedTripId]);

    const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
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

    const _totalSignups = Array.from(signupsByActivity.values()).reduce((acc, curr) => acc + curr.length, 0);
    const _avgPrice = activities.length > 0 ? (activities.reduce((acc, curr) => acc + (curr.price || 0), 0) / activities.length).toFixed(2) : '0.00';


    const _activeTrip = initialTrips.find(t => t.id === selectedTripId) || initialTrips[0];

    return (
        <div className="w-full">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="min-w-[240px]">
                        <select
                            value={selectedTripId}
                            onChange={handleTripChange}
                            className="beheer-select text-xs font-semibold"
                        >
                            {initialTrips.map(trip => (
                                <option key={trip.id} value={trip.id}>{trip.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setEditingActivity({})}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-(--beheer-accent) text-white rounded-xl font-semibold text-xs shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Nieuwe Activiteit</span>
                    </button>
                </div>




                {editingActivity && (
                    <TripActivityForm
                        activity={editingActivity}
                        onSave={handleSave}
                        onCancel={() => setEditingActivity(null)}
                        pending={false}
                    />
                )}

                {activities.length === 0 && !editingActivity ? (
                    <div className="py-24 text-center bg-(--beheer-card-bg) rounded-3xl border-2 border-dashed border-(--beheer-border)/20">
                        <Layers className="h-12 w-12 text-(--beheer-text-muted) mx-auto mb-4 opacity-10" />
                        <p className="text-(--beheer-text-muted) font-semibold text-base opacity-60">
                            Nog geen activiteiten voor deze reis
                        </p>
                    </div>
                ) : (
                    !editingActivity && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {activities.map(activity => (
                                <TripActivityCard
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
                    <TripActivitySignupsModal
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
    );
}
