'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Users, Plane, Edit, Trash2, Loader2, AlertCircle, UserCheck, UserX, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { Trip, TripSignup, TripSignupActivity } from '@salvemundi/validations';
import { updateSignupStatus, deleteTripSignup, sendPaymentEmail, getSignupActivities } from '@/server/actions/admin-reis.actions';

interface AdminReisTableIslandProps {
    initialSignups: TripSignup[];
    trip: Trip;
    stats: {
        total: number;
        confirmed: number;
        waitlist: number;
        depositPaid: number;
        fullPaid: number;
    }
}

export default function AdminReisTableIsland({ initialSignups, trip, stats }: AdminReisTableIslandProps) {
    const router = useRouter();
    const [signups, setSignups] = useState<TripSignup[]>(initialSignups);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [signupActivitiesMap, setSignupActivitiesMap] = useState<Record<number, TripSignupActivity[]>>({});
    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);
    const [isLoadingActivities, setIsLoadingActivities] = useState<Record<number, boolean>>({});

    const filteredSignups = signups.filter(signup => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const fullName = `${signup.first_name} ${signup.middle_name || ''} ${signup.last_name}`.toLowerCase();
            if (!fullName.includes(query) && !signup.email.toLowerCase().includes(query)) return false;
        }
        if (statusFilter !== 'all' && signup.status !== statusFilter) return false;
        if (roleFilter !== 'all' && signup.role !== roleFilter) return false;
        return true;
    });

    const pendingActions = {
        delete: new Set<number>(),
        status: new Set<number>()
    };
    const [actionStates, setActionStates] = useState(pendingActions);

    const toggleExpand = async (signup: TripSignup) => {
        if (expandedIds.includes(signup.id)) {
            setExpandedIds(prev => prev.filter(id => id !== signup.id));
            return;
        }

        setExpandedIds(prev => [...prev, signup.id]);

        if (!signupActivitiesMap[signup.id]) {
            setIsLoadingActivities(prev => ({ ...prev, [signup.id]: true }));
            try {
                const activities = await getSignupActivities(signup.id);
                setSignupActivitiesMap(prev => ({ ...prev, [signup.id]: activities }));
            } catch (err) {
                console.error('Failed to load signup activities:', err);
                setSignupActivitiesMap(prev => ({ ...prev, [signup.id]: [] }));
            } finally {
                setIsLoadingActivities(prev => ({ ...prev, [signup.id]: false }));
            }
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        setActionStates(prev => ({ ...prev, status: new Set(prev.status).add(id) }));
        const signup = signups.find(s => s.id === id);

        if (signup && newStatus === 'confirmed' && !signup.deposit_paid) {
            if (!confirm(`Let op: Door de status naar 'Bevestigd' te wijzigen, wordt er automatisch een e-mail met het aanbetalingsverzoek naar ${signup.first_name} gestuurd.\n\nWeet je zeker dat je door wilt gaan?`)) {
                setActionStates(prev => {
                    const newSet = new Set(prev.status);
                    newSet.delete(id);
                    return { ...prev, status: newSet };
                });
                return;
            }
        }

        try {
            const res = await updateSignupStatus(id, newStatus);
            if (res.success) {
                setSignups(signups.map(s => s.id === id ? { ...s, status: newStatus } : s));
            } else {
                alert(res.error || 'Er is een fout opgetreden bij het updaten van de status.');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Er is een fout opgetreden bij het updaten van de status.');
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
            } else {
                alert(res.error || 'Er is een fout opgetreden bij het verwijderen van de aanmelding.');
            }
        } catch (error) {
            console.error('Failed to delete signup:', error);
            alert('Er is een fout opgetreden bij het verwijderen van de aanmelding.');
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
                alert('Deze persoon heeft de aanbetaling nog niet betaald. Stuur eerst een aanbetalingsverzoek.');
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
                alert(`${paymentType === 'deposit' ? 'Aanbetaling' : 'Restbetaling'}sverzoek is succesvol verzonden naar ${signup.email}`);
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
            alert(`Er is een fout opgetreden bij het verzenden van de email: ${message}`);
        } finally {
            setSendingEmailTo(null);
        }
    };

    const downloadExcel = async () => {
        if (filteredSignups.length === 0) return;

        try {
            // Dynamic import of heavy xlsx library (Performance optimization)
            const XLSX = await import('xlsx');

            // Note: in a real big system we would lazy load ALL activities first if needed, 
            // for now we use what we have in signupActivitiesMap or fetch them dynamically
            // But this mirrors legacy behaviour exactly for V7

            const excelData = filteredSignups.map(signup => {
                const idDoc = signup.id_document_type || '';
                const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

                const activities = signupActivitiesMap[signup.id] || [];
                // Simplified activity extraction exactly as legacy
                const activitiesStr = activities.map(a => a.trip_activity_id?.name || a.trip_activity_id).join(', ');

                return {
                    'Voornaam': signup.first_name,
                    'Tussenvoegsel': signup.middle_name || '',
                    'Achternaam': signup.last_name,
                    'Volledige naam': `${signup.first_name} ${signup.middle_name || ''} ${signup.last_name}`.trim(),
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
                    'Aangemeld op': format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm'),
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
        } catch (error) {
            console.error('Failed to export excel:', error);
            alert('Export mislukt - kon de Excel bibliotheek niet laden.');
        }
    };

    const getPaymentStatus = (signup: TripSignup) => {
        if (signup.full_payment_paid) {
            return { label: 'Volledig betaald', color: 'bg-[var(--theme-success)]/10 text-[var(--theme-success)]' };
        } else if (signup.deposit_paid) {
            return { label: 'Aanbetaling voldaan', color: 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)]' };
        } else {
            return { label: 'Nog geen betaling', color: 'bg-[var(--theme-error)]/10 text-[var(--theme-error)]' };
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            registered: { label: 'Geregistreerd', color: 'bg-[var(--theme-info)]/10 text-[var(--theme-info)]' },
            waitlist: { label: 'Wachtlijst', color: 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)]' },
            confirmed: { label: 'Bevestigd', color: 'bg-[var(--theme-success)]/10 text-[var(--theme-success)]' },
            cancelled: { label: 'Geannuleerd', color: 'bg-[var(--text-light)]/10 text-[var(--text-light)]' },
        };
        return statusMap[status] || { label: status, color: 'bg-[var(--text-light)]/10 text-[var(--text-light)]' };
    };

    return (
        <>
            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
                <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-admin-muted text-xs sm:text-sm">Totaal</p>
                            <p className="text-xl sm:text-2xl font-bold text-admin">{stats.total}</p>
                        </div>
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-admin-muted text-xs sm:text-sm">Bevestigd</p>
                            <p className="text-xl sm:text-2xl font-bold text-admin">{stats.confirmed}</p>
                        </div>
                        <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-admin-muted text-xs sm:text-sm">Wachtlijst</p>
                            <p className="text-xl sm:text-2xl font-bold text-admin">{stats.waitlist}</p>
                        </div>
                        <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-admin-muted text-xs sm:text-sm">Aanbetaling</p>
                            <p className="text-xl sm:text-2xl font-bold text-admin">{stats.depositPaid}</p>
                        </div>
                        <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-admin-muted text-xs sm:text-sm">Volledig betaald</p>
                            <p className="text-xl sm:text-2xl font-bold text-admin">{stats.fullPaid}</p>
                        </div>
                        <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-admin-muted h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Zoek op naam of e-mailadres..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                        >
                            <option value="all">Alle statussen</option>
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                        >
                            <option value="all">Alle rollen</option>
                            <option value="participant">Deelnemer</option>
                            <option value="crew">Crew</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-4">
                    <button
                        onClick={downloadExcel}
                        disabled={filteredSignups.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--theme-success)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
                        <Download className="h-5 w-5" />
                        Export naar Excel
                    </button>
                    {/* Reis Instellingen (Legacy kept it here too, but could be on page level) */}
                    <button
                        onClick={() => router.push('/beheer/reis/instellingen')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition w-full sm:w-auto"
                    >
                        <Edit className="h-5 w-5" />
                        Reis Instellingen
                    </button>
                </div>
            </div>

            {/* Signups Table */}
            <div className="bg-admin-card rounded-lg shadow overflow-hidden">
                {filteredSignups.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-admin-muted mx-auto mb-4" />
                        <p className="text-admin-muted">Geen aanmeldingen gevonden</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-admin-card-soft border-b border-admin">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Naam</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden sm:table-cell">Geboortedatum</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden md:table-cell">Rol</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Status</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden sm:table-cell">Betalingstatus</th>
                                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-admin-muted uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="bg-admin-card divide-y divide-admin">
                                {filteredSignups.map(signup => {
                                    const paymentStatus = getPaymentStatus(signup);
                                    const statusBadge = getStatusBadge(signup.status);

                                    return (
                                        <Fragment key={signup.id}>
                                            <tr onClick={() => toggleExpand(signup)} className="hover:bg-admin-hover cursor-pointer">
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-medium text-admin">
                                                        {signup.first_name} {signup.middle_name} {signup.last_name}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-admin-muted">{signup.email}</div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-admin hidden sm:table-cell">
                                                    {signup.date_of_birth ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy') : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${signup.role === 'crew' ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)]' : 'bg-[var(--text-light)]/10 text-[var(--text-light)]'}`}>
                                                        {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {actionStates.status.has(signup.id) ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-theme-purple" />
                                                    ) : (
                                                        <select
                                                            value={signup.status}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => handleStatusChange(signup.id, e.target.value)}
                                                            className={`px-1.5 sm:px-2 py-1 text-xs font-semibold rounded-full border-0 ${statusBadge.color} dark:bg-opacity-20 w-full sm:w-auto`}>
                                                            <option value="registered">Geregistreerd</option>
                                                            <option value="confirmed">Bevestigd</option>
                                                            <option value="waitlist">Wachtlijst</option>
                                                            <option value="cancelled">Geannuleerd</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatus.color}`}>
                                                        {paymentStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-1 sm:gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/beheer/reis/deelnemer/${signup.id}`); }}
                                                            className="text-theme-purple hover:text-theme-purple-dark p-1 sm:p-0" 
                                                            title="Bewerken"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(signup.id); }}
                                                            disabled={actionStates.delete.has(signup.id)}
                                                            className="text-red-600 hover:text-red-800 p-1 sm:p-0 disabled:opacity-50"
                                                            title="Verwijderen"
                                                        >
                                                            {actionStates.delete.has(signup.id) ? (
                                                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                            )}
                                                        </button>
                                                        <button className="text-admin-muted p-1 sm:p-0 focus:outline-none">
                                                            <span className="text-xs sm:text-sm">{expandedIds.includes(signup.id) ? '▲' : '▼'}</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedIds.includes(signup.id) && (
                                                <tr className="bg-admin-card-soft">
                                                    <td colSpan={6} className="px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                            <div>
                                                                <p className="text-sm font-semibold text-admin">Contact</p>
                                                                <p className="text-sm text-admin"><span className="opacity-60">E-mailadres:</span> {signup.email}</p>
                                                                <p className="text-sm text-admin"><span className="opacity-60">Telefoonnummer:</span> {signup.phone_number || '-'}</p>
                                                                <p className="text-sm text-admin">ID Type: {signup.id_document_type === 'passport' ? 'Paspoort' : signup.id_document_type === 'id_card' ? 'ID Kaart' : (signup.id_document_type || '-')}</p>
                                                                <p className="text-sm text-admin">Document nummer: {signup.document_number || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-admin">Extra informatie</p>
                                                                <p className="text-sm text-admin">Allergieën: {signup.allergies || '-'}</p>
                                                                <p className="text-sm text-admin">Bijzonderheden: {signup.special_notes || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-admin">Activiteiten</p>
                                                                {isLoadingActivities[signup.id] ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Loader2 className="h-4 w-4 animate-spin text-theme-purple" />
                                                                        <span className="text-sm text-admin-muted">Activiiteiten ophalen...</span>
                                                                    </div>
                                                                ) : signupActivitiesMap[signup.id] ? (
                                                                    signupActivitiesMap[signup.id].length > 0 ? (
                                                                        signupActivitiesMap[signup.id].map(a => (
                                                                            <div key={a.id} className="flex items-center justify-between text-sm text-admin">
                                                                                {/* V7 Simplified relation display */}
                                                                                <span>{a.trip_activity_id?.name || 'Activiteit ID ' + a.trip_activity_id}</span>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-admin-muted">Geen activiteiten geselecteerd</p>
                                                                    )
                                                                ) : (
                                                                    <p className="text-sm text-admin-muted">Geen data beschikbaar</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="border-t border-admin pt-4 mt-4">
                                                            <p className="text-sm font-semibold text-admin mb-2">Betaalverzoek versturen (internationaal)</p>
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleResendPaymentEmail(signup.id, 'deposit'); }}
                                                                    disabled={sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'deposit'}
                                                                    className={`flex items-center justify-center gap-2 px-4 py-2 ${signup.deposit_email_sent ? 'bg-admin-hover text-admin' : 'bg-yellow-600 text-white'} text-sm rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                >
                                                                    {sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'deposit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                                    Aanbetaling {signup.deposit_email_sent && <span className="ml-1 text-[10px] font-bold uppercase opacity-60">(Verzonden)</span>}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleResendPaymentEmail(signup.id, 'final'); }}
                                                                    disabled={(sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'final') || !trip.allow_final_payments}
                                                                    className={`flex items-center justify-center gap-2 px-4 py-2 ${signup.final_email_sent ? 'bg-admin-hover text-admin' : 'bg-green-600 text-white'} text-sm rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                >
                                                                    {sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'final' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                                    Restbetaling {signup.final_email_sent && <span className="ml-1 text-[10px] font-bold uppercase opacity-60">(Verzonden)</span>}
                                                                </button>
                                                                {!trip.allow_final_payments && <span className="text-[10px] text-red-500 italic flex items-center">Restbetalingen nog niet geopend</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
