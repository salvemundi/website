'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Layers, 
    Users, 
    Plus, 
    Euro, 
    Settings2, 
    ChevronDown 
} from 'lucide-react';
import { deleteTripActivity, createTripActivity, updateTripActivity } from '@/server/actions/reis-admin-activities.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';

import { useAdminToast } from '@/hooks/use-admin-toast';

// Reuse sub-components from Phase 2
import TripActivityCard from './reis/TripActivityCard';
import TripActivityForm from './reis/TripActivityForm';
import TripActivitySignupsModal from './reis/TripActivitySignupsModal';
interface Trip {
    id: number;
    name: string;
}

interface TripActivity {
    id: number;
    trip_id: number;
    name: string;
    description?: string | null;
    price: number;
    image?: string | null;
    max_participants?: number | null;
    is_active: boolean;
    display_order: number;
    options?: { name: string; price: number }[] | null;
    max_selections?: number | null;
}

interface Props {
    initialTrips?: Trip[];
    initialActivities?: TripActivity[];
    initialSelectedTripId?: number;
    initialSignupsByActivity?: Record<number, any[]>;
}

export default function ReisActiviteitenIsland({ 
    initialTrips = [], 
    initialActivities = [], 
    initialSelectedTripId = 0,
    initialSignupsByActivity = {},
}: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [selectedTripId, setSelectedTripId] = useState<number>(initialSelectedTripId);
    const [activities, setActivities] = useState<TripActivity[]>(initialActivities);
    const [signupsByActivity] = useState<Record<number, any[]>>(initialSignupsByActivity);
    
    const [isPending, startTransition] = useTransition();
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

    const handleSave = async (formData: FormData, options: any[]) => {
        formData.set('options', JSON.stringify(options));
        
        let res;
        if (editingActivity?.id) {
            formData.set('id', editingActivity.id.toString());
            res = await updateTripActivity({}, formData);
        } else {
            formData.set('trip_id', selectedTripId.toString());
            res = await createTripActivity({}, formData);
        }

        if (res.success) {
            showToast(editingActivity?.id ? 'Activiteit bijgewerkt' : 'Activiteit aangemaakt', 'success');
            setEditingActivity(null);
            router.refresh();
        } else {
            showToast(res.error || 'Fout bij opslaan', 'error');
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

    const totalSignups = Object.values(signupsByActivity).reduce((acc, curr) => acc + curr.length, 0);
    const avgPrice = activities.length > 0 ? (activities.reduce((acc, curr) => acc + (curr.price || 0), 0) / activities.length).toFixed(2) : '0.00';

    const adminStats = [
        { label: 'Activiteiten', value: activities.length, icon: Layers, theme: 'blue' },
        { label: 'Actief', value: activities.filter(a => a.is_active).length, icon: Layers, theme: 'emerald' },
    ];

    const activeTrip = initialTrips.find(t => t.id === selectedTripId) || initialTrips[0];

    return (
        <>
            <AdminToolbar 
                actions={
                    <>
                        <div className="relative group min-w-[240px]">
                                <select
                                    value={selectedTripId}
                                    onChange={handleTripChange}
                                    className="w-full pl-4 pr-10 py-3 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-[0.2em] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all appearance-none cursor-pointer shadow-inner outline-none"
                                >
                                    {initialTrips.map(trip => (
                                        <option key={trip.id} value={trip.id} className="bg-[var(--beheer-card-bg)] text-base font-bold uppercase">{trip.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>

                            <button
                                onClick={() => setEditingActivity({})}
                                className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                Nieuw
                            </button>
                        </>
                    }
                />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <AdminStatsBar stats={adminStats} />

                {/* Form Section */}
                {editingActivity && (
                    <TripActivityForm 
                        activity={editingActivity}
                        onSave={handleSave}
                        onCancel={() => setEditingActivity(null)}
                        pending={false}
                    />
                )}

                {/* List View */}
                {activities.length === 0 && !editingActivity ? (
                    <div className="py-24 text-center bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border-2 border-dashed border-[var(--beheer-border)]">
                        <Layers className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] opacity-60">Nog geen activiteiten voor deze reis</p>
                    </div>
                ) : (
                    !editingActivity && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {activities.map(activity => (
                                <TripActivityCard 
                                    key={activity.id} 
                                    activity={activity as any} 
                                    onEdit={setEditingActivity}
                                    onDelete={handleDelete}
                                    onViewSignups={setViewingSignupsId}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* Signups Modal */}
                {viewingSignupsId && (
                    <TripActivitySignupsModal 
                        activityName={activities.find(a => a.id === viewingSignupsId)?.name || ''}
                        options={activities.find(a => a.id === viewingSignupsId)?.options}
                        signups={signupsByActivity[viewingSignupsId] || []}
                        loading={false}
                        onClose={() => setViewingSignupsId(null)}
                    />
                )}

                {/* Toast Notification */}
                {toast && (
                    <AdminToast 
                        toast={toast} 
                        onClose={hideToast} 
                    />
                )}
            </div>
        </>
    );
}
