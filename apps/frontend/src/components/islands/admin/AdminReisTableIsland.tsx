'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { Trip, TripSignup, TripSignupActivity } from '@salvemundi/validations';
import { updateSignupStatus, deleteTripSignup, sendPaymentEmail } from '@/server/actions/reis-admin-signups.actions';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { Plane, Users, UserCheck, UserX } from 'lucide-react';
import ReisFilters from '@/components/admin/reis/ReisFilters';
import ReisTable from '@/components/admin/reis/ReisTable';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface AdminReisTableIslandProps {
    initialSignups: TripSignup[];
    initialSignupActivities: Record<number, TripSignupActivity[]>;
    trip: Trip;
    stats: {
        total: number;
        confirmed: number;
        waitlist: number;
        depositPaid: number;
        fullPaid: number;
    }
}

export default function AdminReisTableIsland({ initialSignups, initialSignupActivities, trip, stats }: AdminReisTableIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [signups, setSignups] = useState<TripSignup[]>(initialSignups);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [signupActivitiesMap] = useState<Record<number, TripSignupActivity[]>>(initialSignupActivities);
    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);

    const [actionStates, setActionStates] = useState({
        delete: new Set<number>(),
        status: new Set<number>()
    });

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

    const toggleExpand = (signup: TripSignup) => {
        if (expandedIds.includes(signup.id)) {
            setExpandedIds(prev => prev.filter(id => id !== signup.id));
            return;
        }
        setExpandedIds(prev => [...prev, signup.id]);
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        setActionStates(prev => ({ ...prev, status: new Set(prev.status).add(id) }));
        const signup = signups.find(s => s.id === id);

        try {
            const res = await updateSignupStatus(id, newStatus);
            if (res.success) {
                setSignups(signups.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
                showToast(`Status succesvol bijgewerkt naar ${newStatus}`, 'success');
            } else {
                showToast(res.error || 'Fout bij bijwerken status.', 'error');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
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
                showToast('Aanmelding succesvol verwijderd', 'success');
            } else {
                showToast(res.error || 'Fout bij verwijderen aanmelding.', 'error');
            }
        } catch (error) {
            console.error('Failed to delete signup:', error);
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
                setSignups(prev => prev.map(s => s.id === signupId ? {
                    ...s,
                    [paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent']: true
                } : s));
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Onbekende fout';
            console.error('Failed to send payment email:', error);
            showToast(`Fout bij verzenden email: ${message}`, 'error');
        } finally {
            setSendingEmailTo(null);
        }
    };

    const downloadExcel = async () => {
        if (filteredSignups.length === 0) return;

        try {
            const XLSX = await import('xlsx');

            const excelData = filteredSignups.map(signup => {
                const idDoc = signup.id_document || '';
                const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

                const activities = signupActivitiesMap[signup.id] || [];
                const activitiesStr = activities.map(a => {
                    const activity = a as any;
                    const name = activity.activity_name || activity.trip_activity_id?.name || activity.trip_activity_id;
                    
                    const rawOptions = typeof activity.selected_options === 'string' ? JSON.parse(activity.selected_options) : (activity.selected_options || {});
                    const metaOptionsRaw = activity.activity_options || activity.trip_activity_id?.options || [];
                    const metaOptions = typeof metaOptionsRaw === 'string' ? JSON.parse(metaOptionsRaw) : (metaOptionsRaw || []);
                    
                    const opts = Object.keys(rawOptions);
                    const optNames = opts.map(id => {
                        const opt = metaOptions.find((m: any) => m.id === id);
                        return opt?.name || id;
                    }).filter(Boolean);
                    
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
                    'Rol': signup.role === 'crew' ? 'Crew' : 'Deelnemer',
                    'Status': getStatusBadge(signup.status).label,
                    'Betalingstatus': getPaymentStatus(signup).label,
                    'Aanbetaling betaald op': signup.deposit_paid_at ? format(new Date(signup.deposit_paid_at), 'dd-MM-yyyy HH:mm') : '',
                    'Volledige betaling op': signup.full_payment_paid_at ? format(new Date(signup.full_payment_paid_at), 'dd-MM-yyyy HH:mm') : '',
                    'Aangemeld op': signup.created_at ? format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm') : '',
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Aanmeldingen');

            const maxWidth = 50;
            const colWidths = Object.keys(excelData[0] || {}).map(key => ({
                wch: Math.min(maxWidth, Math.max(key.length, ...excelData.map(row => String(row[key as keyof typeof row] || '').length)))
            }));
            worksheet['!cols'] = colWidths;

            XLSX.writeFile(workbook, `reis-aanmeldingen-${trip.name || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            showToast('Excel bestand succesvol gegenereerd', 'success');
        } catch (error) {
            console.error('Failed to export excel:', error);
            showToast('Export mislukt - kon de Excel bibliotheek niet laden.', 'error');
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
            cancelled: { label: 'Geannuleerd', color: 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)]' },
        };
        return statusMap[status] || { label: status, color: 'bg-[var(--beheer-text-muted)]/10 text-[var(--beheer-text-muted)]' };
    };

    const displayStats = [
        { label: 'Aanmeldingen', value: stats.total, icon: Users },
        { label: 'Wachtlijst', value: stats.waitlist, icon: UserX },
        { label: 'Bevestigd', value: stats.confirmed, icon: UserCheck },
        { label: 'Aanbetaling', value: stats.depositPaid, icon: Plane },
        { label: 'Volledig', value: stats.fullPaid, icon: Plane }
    ];

    return (
        <>
            <AdminStatsBar stats={displayStats} />

            <ReisFilters 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                onDownloadExcel={downloadExcel}
                hasResults={filteredSignups.length > 0}
            />

            <ReisTable 
                filteredSignups={filteredSignups}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                getStatusBadge={getStatusBadge}
                getPaymentStatus={getPaymentStatus}
                actionStates={actionStates}
                sendingEmailTo={sendingEmailTo}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onResendEmail={handleResendPaymentEmail}
                signupActivitiesMap={signupActivitiesMap}
                allowFinalPayments={!!trip.allow_final_payments}
            />
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
