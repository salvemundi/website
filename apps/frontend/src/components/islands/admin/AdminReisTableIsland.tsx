'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Trip, TripSignup, TripSignupActivity, TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { updateSignupStatus, deleteTripSignup, sendPaymentEmail, updateTripSignup, updateSignupActivities } from '@/server/actions/reis-admin-signups.actions';
import { Users, UserCheck, UserX, CreditCard, Banknote, Download, Mail, Ticket, Edit2, ChevronDown, Send, X, CheckCircle, Save, Loader2, Trash2 } from 'lucide-react';
import ReisManagementHeader from '@/components/admin/reis/ReisManagementHeader';
import ReisFilters from '@/components/admin/reis/ReisFilters';
import ReisTable from '@/components/admin/reis/ReisTable';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions } from '@/lib/reis';
import { downloadCSV } from '@/lib/utils/export';
import SignupForm from './reis/SignupForm';
import SignupActivities from './reis/SignupActivities';
import SignupView from './reis/SignupView';
import AdminReisSignupModalIsland from './reis/AdminReisSignupModalIsland';

interface AdminReisTableIslandProps {
    title: string;
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

export default function AdminReisTableIsland({ 
    title,
    backHref,
    initialSignups = [], 
    initialSignupActivities = {}, 
    allTripActivities = [],
    trip, 
    trips = [],
    initialSettings = { show: false },
    stats
}: AdminReisTableIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const { toast, showToast, hideToast } = useAdminToast();
    const [signups, setSignups] = useState<TripSignup[]>(initialSignups);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [selectedSignup, setSelectedSignup] = useState<TripSignup | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const formRef = React.useRef<HTMLFormElement>(null);

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
            // 1. Update basic info
            const res = await updateTripSignup(null, formData);
            if (!res.success) {
                showToast(res.error || 'Fout bij het opslaan', 'error');
                return;
            }
            
            // 2. Update activities
            const actRes = await updateSignupActivities(selectedSignup.id, selectedActivities);
            if (!actRes.success) {
                showToast(actRes.error || 'Fout bij bijwerken activiteiten', 'error');
            }

            showToast('Wijzigingen opgeslagen', 'success');
            
            // Update local state for both the list and the selected item
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
        } catch (err) {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFromModal = async () => {
        if (!selectedSignup) return;
        if (!confirm('Weet je zeker dat je deze deelnemer wilt verwijderen?')) return;
        
        startTransition(async () => {
            const res = await deleteTripSignup(selectedSignup.id);
            if (res.success) {
                showToast('Deelnemer verwijderd', 'success');
                setSelectedSignup(null);
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
        });
    };

    // Scroll Lock when modal is open
    useEffect(() => {
        if (selectedSignup) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [selectedSignup]);

    const [signupActivitiesMap] = useState<Record<number, TripSignupActivity[]>>(initialSignupActivities);
    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);

    const [actionStates, setActionStates] = useState({
        delete: new Set<number>(),
        status: new Set<number>()
    });

    // Sync trips state with server data after revalidation
    useEffect(() => {
        setSignups(initialSignups);
    }, [initialSignups]);

    const currentTripId = searchParams.get('tripId');
    const selectedId = currentTripId ? Number(currentTripId) : (trips.length > 0 ? trips[0].id : '');

    const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        router.push(`/beheer/reis${val ? `?tripId=${val}` : ''}`);
    };

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

    const handleStatusChange = async (id: number, newStatus: string) => {
        setActionStates(prev => ({ ...prev, status: new Set(prev.status).add(id) }));

        try {
            const res = await updateSignupStatus(id, newStatus);
            if (res.success) {
                setSignups(signups.map(s => s.id === id ? { ...s, status: newStatus as TripSignup['status'] } : s));
                if (selectedSignup?.id === id) {
                    setSelectedSignup(prev => prev ? { ...prev, status: newStatus as TripSignup['status'] } : null);
                }
                showToast(`Status succesvol bijgewerkt naar ${newStatus}`, 'success');
            } else {
                showToast(res.error || 'Fout bij bijwerken status.', 'error');
            }
        } catch (error) {
            showToast('Fout bij bijwerken status.', 'error');
        } finally {
            setActionStates(prev => {
                const newSet = new Set(prev.status);
                newSet.delete(id);
                return { ...prev, status: newSet };
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;

        setActionStates(prev => ({ ...prev, delete: new Set(prev.delete).add(id) }));
        try {
            const res = await deleteTripSignup(id);
            if (res.success) {
                setSignups(signups.filter(s => s.id !== id));
                if (selectedSignup?.id === id) setSelectedSignup(null);
                showToast('Aanmelding succesvol verwijderd', 'success');
            } else {
                showToast(res.error || 'Fout bij verwijderen aanmelding.', 'error');
            }
        } catch (error) {
            showToast('Fout bij verwijderen aanmelding.', 'error');
        } finally {
            setActionStates(prev => {
                const newSet = new Set(prev.delete);
                newSet.delete(id);
                return { ...prev, delete: newSet };
            });
        }
    };

    const handleResendPaymentEmail = async (signupId: number, paymentType: 'deposit' | 'final') => {
        const signup = signups.find(s => s.id === signupId);
        if (!signup) return;

        if (paymentType === 'deposit' && signup.deposit_paid) {
            if (!confirm('Deze persoon heeft de aanbetaling al betaald. Wil je toch een betaalverzoek sturen?')) return;
        }

        if (paymentType === 'final') {
            if (!signup.deposit_paid) {
                showToast('Aanbetaling nog niet betaald. Stuur eerst een aanbetalingsverzoek.', 'error');
                return;
            }
            if (signup.full_payment_paid) {
                if (!confirm('Deze persoon heeft al volledig betaald. Wil je toch een betaalverzoek sturen?')) return;
            }
        }

        setSendingEmailTo({ signupId, type: paymentType });

        try {
            const res = await sendPaymentEmail(signupId, trip.id, paymentType);

            if (res.success) {
                showToast(`${paymentType === 'deposit' ? 'Aanbetaling' : 'Restbetaling'}sverzoek succesvol verzonden naar ${signup.email}`, 'success');
                const update = (s: TripSignup) => s.id === signupId ? {
                    ...s,
                    [paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent']: true
                } : s;
                setSignups(prev => prev.map(update));
                if (selectedSignup?.id === signupId) setSelectedSignup(prev => prev ? update(prev) : null);
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Onbekende fout';
            showToast(`Fout bij verzenden email: ${message}`, 'error');
        } finally {
            setSendingEmailTo(null);
        }
    };

    const downloadCSVExport = async () => {
        if (filteredSignups.length === 0) return;

        try {
            interface ExpandedTripSignupActivity {
                activity_name?: string;
                trip_activity_id?: number | { name?: string; options?: string | unknown[] };
                selected_options?: string | Record<string, unknown>;
                activity_options?: string | unknown[];
            }

            const csvData = filteredSignups.map(signup => {
                const idDoc = signup.id_document || '';
                const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

                const activities = signupActivitiesMap[signup.id] || [];
                const activitiesStr = activities.map(a => {
                    const activity = a as unknown as ExpandedTripSignupActivity;
                    const tripActIdObj = typeof activity.trip_activity_id === 'object' ? activity.trip_activity_id : null;
                    const name = activity.activity_name || tripActIdObj?.name || String(activity.trip_activity_id);
                    
                    const rawOptions = parseSelectedOptions(typeof activity.selected_options === 'string' ? activity.selected_options : JSON.stringify(activity.selected_options || {}));
                    const metaOptions = parseActivityOptions(typeof activity.activity_options === 'string' ? activity.activity_options : (typeof tripActIdObj?.options === 'string' ? tripActIdObj.options : JSON.stringify(tripActIdObj?.options || [])));
                    
                    const opts = Object.keys(rawOptions);
                    const optNames = opts.map(id => mapActivityOptionIdToName(id, metaOptions)).filter(Boolean);
                    
                    return optNames.length > 0 ? `${name} (${optNames.join(', ')})` : name;
                }).join(' | ');

                return {
                    'Voornaam': signup.first_name,
                    'Achternaam': signup.last_name,
                    'Volledige naam': `${signup.first_name} ${signup.last_name}`.trim(),
                    'E-mailadres': signup.email,
                    'Telefoonnummer': signup.phone_number,
                    'Geboortedatum': signup.date_of_birth ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy') : '',
                    'ID Type': idDocLabel,
                    'Document nummer': signup.document_number || '',
                    'Allergieën': signup.allergies || '',
                    'Bijzonderheden': signup.special_notes || '',
                    'Activiteiten': activitiesStr,
                    'Wil rijden': signup.willing_to_drive ? 'Ja' : 'Nee',
                    'Rol': signup.role === 'crew' ? 'Crew' : 'Reiziger',
                    'Status': getStatusBadge(signup.status || 'registered').label,
                    'Betalingstatus': getPaymentStatus(signup).label,
                    'Aanbetaling betaald op': signup.deposit_paid_at ? format(new Date(signup.deposit_paid_at), 'dd-MM-yyyy HH:mm') : '',
                    'Volledige betaling op': signup.full_payment_paid_at ? format(new Date(signup.full_payment_paid_at), 'dd-MM-yyyy HH:mm') : '',
                    'Aangemeld op': signup.date_created ? format(new Date(signup.date_created), 'dd-MM-yyyy HH:mm') : '' };
            });

            downloadCSV(csvData, `reis-aanmeldingen-${trip.name || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            showToast('CSV bestand succesvol gegenereerd', 'success');
        } catch (error) {
            showToast('Export mislukt.', 'error');
        }
    };

    const getPaymentStatus = (signup: TripSignup) => {
        if (signup.full_payment_paid) {
            return { label: 'Volledig betaald', color: 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)]' };
        } else if (signup.deposit_paid) {
            return { label: 'Aanbetaling voldaan', color: 'bg-yellow-500/10 text-yellow-600' };
        } else {
            return { label: 'Nog geen betaling', color: 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)]' };
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            registered: { label: 'Geregistreerd', color: 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)]' },
            waitlist: { label: 'Wachtlijst', color: 'bg-yellow-500/10 text-yellow-600' },
            confirmed: { label: 'Bevestigd', color: 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)]' },
            cancelled: { label: 'Geannuleerd', color: 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)]' } };
        return statusMap[status] || { label: status, color: 'bg-[var(--beheer-text-muted)]/10 text-[var(--beheer-text-muted)]' };
    };

    const displayStats = [
        { label: 'Aanmeldingen', value: stats?.total || 0, icon: Users },
        { label: 'Wachtlijst', value: stats?.waitlist || 0, icon: UserX },
        { label: 'Bevestigd', value: stats?.confirmed || 0, icon: UserCheck },
        { label: 'Aanbetaling', value: stats?.depositPaid || 0, icon: Banknote },
        { label: 'Volledig', value: stats?.fullPaid || 0, icon: CreditCard }
    ];

    return (
        <div className="space-y-4">
            <ReisManagementHeader 
                title={title}
                backHref={backHref}
                trips={trips}
                selectedId={selectedId}
                onTripChange={handleTripChange}
                onExport={downloadCSVExport}
                hasResults={filteredSignups.length > 0}
            />

            <div className="px-6 sm:px-12 py-8 flex flex-col gap-8">
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
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onResendEmail={handleResendPaymentEmail}
                    signupActivitiesMap={signupActivitiesMap}
                    allowFinalPayments={!!trip?.allow_final_payments}
                    isBusTrip={!!trip?.is_bus_trip}
                />
            </div>

            {mounted && (
                <AdminReisSignupModalIsland
                    isOpen={!!selectedSignup}
                    isEditing={isEditing}
                    isPending={isPending}
                    selectedSignup={selectedSignup}
                    trip={trip}
                    allTripActivities={allTripActivities}
                    selectedActivities={selectedActivities}
                    sendingEmailTo={sendingEmailTo}
                    formRef={formRef}
                    onClose={() => {
                        if (isEditing) setIsEditing(false);
                        else setSelectedSignup(null);
                    }}
                    onToggleEdit={() => setIsEditing(!isEditing)}
                    onDelete={handleDeleteFromModal}
                    onSave={handleSave as unknown as (formData: FormData) => void}
                    onToggleActivity={handleToggleActivity}
                    onResendEmail={handleResendPaymentEmail}
                />
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
