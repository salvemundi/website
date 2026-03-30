'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Users, Plane, Edit, Trash2, Loader2, AlertCircle, UserCheck, UserX, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { Trip, TripSignup, TripSignupActivity } from '@salvemundi/validations';
import { updateSignupStatus, deleteTripSignup, sendPaymentEmail } from '@/server/actions/admin-reis.actions';

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
    const router = useRouter();
    const [signups, setSignups] = useState<TripSignup[]>(initialSignups);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [signupActivitiesMap] = useState<Record<number, TripSignupActivity[]>>(initialSignupActivities);
    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);

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

    const [actionStates, setActionStates] = useState({
        delete: new Set<number>(),
        status: new Set<number>()
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
                setSignups(signups.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
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
            const XLSX = await import('xlsx');

            const excelData = filteredSignups.map(signup => {
                const idDoc = signup.id_document || '';
                const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

                const activities = signupActivitiesMap[signup.id] || [];
                const activitiesStr = activities.map(a => a.trip_activity_id?.name || a.trip_activity_id).join(', ');

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
                    'Aangemeld op': signup.date_created ? format(new Date(signup.date_created), 'dd-MM-yyyy HH:mm') : '',
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

    return (
        <>
            {/* Statistics - Tokenized */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 border-l-4 border-[var(--beheer-accent)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest">Totaal</p>
                            <p className="text-xl sm:text-2xl font-black text-[var(--beheer-text)]">{stats.total}</p>
                        </div>
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--beheer-accent)] opacity-20" />
                    </div>
                </div>

                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 border-l-4 border-[var(--beheer-active)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest">Bevestigd</p>
                            <p className="text-xl sm:text-2xl font-black text-[var(--beheer-text)]">{stats.confirmed}</p>
                        </div>
                        <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--beheer-active)] opacity-20" />
                    </div>
                </div>

                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 border-l-4 border-yellow-500/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest">Wachtlijst</p>
                            <p className="text-xl sm:text-2xl font-black text-[var(--beheer-text)]">{stats.waitlist}</p>
                        </div>
                        <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 border-l-4 border-[var(--beheer-accent)]/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest">Aanbetaling</p>
                            <p className="text-xl sm:text-2xl font-black text-[var(--beheer-text)]">{stats.depositPaid}</p>
                        </div>
                        <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--beheer-accent)] opacity-20" />
                    </div>
                </div>

                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 border-l-4 border-[var(--beheer-active)]/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest">Volledig betaald</p>
                            <p className="text-xl sm:text-2xl font-black text-[var(--beheer-text)]">{stats.fullPaid}</p>
                        </div>
                        <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--beheer-active)] opacity-20" />
                    </div>
                </div>
            </div>

            {/* Filters and Actions - Tokenized */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 mb-6 border border-[var(--beheer-border)]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--beheer-text-muted)] h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Zoek op naam of e-mailadres..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all font-bold text-sm uppercase tracking-widest"
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
                            className="w-full px-4 py-2 border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all font-bold text-sm uppercase tracking-widest"
                        >
                            <option value="all">Alle rollen</option>
                            <option value="participant">Deelnemer</option>
                            <option value="crew">Crew</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-6">
                    <button
                        onClick={downloadExcel}
                        disabled={filteredSignups.length === 0}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-active)] text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4" />
                        Export naar Excel
                    </button>
                    <button
                        onClick={() => router.push('/beheer/reis/instellingen')}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 transition w-full sm:w-auto"
                    >
                        <Edit className="h-4 w-4" />
                        Reis Instellingen
                    </button>
                </div>
            </div>

            {/* Signups Table */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                {filteredSignups.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <AlertCircle className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px]">Geen aanmeldingen gevonden</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--beheer-border)]">
                                <tr>
                                    <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Naam</th>
                                    <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Geboortedatum</th>
                                    <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden md:table-cell">Rol</th>
                                    <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Status</th>
                                    <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Betaling</th>
                                    <th className="px-2 sm:px-6 py-5 text-right text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--beheer-border)]/10">
                                {filteredSignups.map(signup => {
                                    const paymentStatus = getPaymentStatus(signup);
                                    const statusBadge = getStatusBadge(signup.status);

                                    return (
                                        <Fragment key={signup.id}>
                                            <tr onClick={() => toggleExpand(signup)} className="hover:bg-[var(--beheer-accent)]/[0.02] cursor-pointer transition-colors group">
                                                <td className="px-3 sm:px-6 py-4">
                                                    <div className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors">
                                                        {signup.first_name} {signup.last_name}
                                                    </div>
                                                    <div className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{signup.email}</div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs font-black text-[var(--beheer-text)] uppercase tracking-widest hidden sm:table-cell">
                                                    {signup.date_of_birth ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy') : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${signup.role === 'crew' ? 'bg-[var(--beheer-accent)] text-white shadow-sm shadow-[var(--beheer-accent)]/20' : 'bg-[var(--bg-main)] text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]/50'}`}>
                                                        {signup.role === 'crew' ? 'Crew' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {actionStates.status.has(signup.id) ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-[var(--beheer-accent)]" />
                                                    ) : (
                                                        <select
                                                            value={signup.status}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => handleStatusChange(signup.id, e.target.value)}
                                                            className={`px-1.5 sm:px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-0 ${statusBadge.color} dark:bg-opacity-20 w-full sm:w-auto cursor-pointer focus:ring-2 focus:ring-[var(--beheer-accent)]`}>
                                                            <option value="registered">Geregistreerd</option>
                                                            <option value="confirmed">Bevestigd</option>
                                                            <option value="waitlist">Wachtlijst</option>
                                                            <option value="cancelled">Geannuleerd</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${paymentStatus.color}`}>
                                                        {paymentStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/beheer/reis/deelnemer/${signup.id}`); }}
                                                            className="text-[var(--beheer-accent)] hover:opacity-70 transition-all active:scale-90 p-2 bg-[var(--beheer-accent)]/5 rounded-xl border border-[var(--beheer-accent)]/10" 
                                                            title="Bewerken"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(signup.id); }}
                                                            disabled={actionStates.delete.has(signup.id)}
                                                            className="text-[var(--beheer-inactive)] hover:opacity-70 disabled:opacity-50 transition-all active:scale-90 p-2 bg-[var(--beheer-inactive)]/5 rounded-xl border border-[var(--beheer-inactive)]/10"
                                                            title="Verwijderen"
                                                        >
                                                            {actionStates.delete.has(signup.id) ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        <div className="text-[var(--beheer-text-muted)] p-2 hover:text-[var(--beheer-text)] transition-colors">
                                                            <span className="text-xs transition-transform duration-300 inline-block" style={{ transform: expandedIds.includes(signup.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedIds.includes(signup.id) && (
                                                <tr className="bg-[var(--bg-main)]/30">
                                                    <td colSpan={6} className="px-8 py-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)]">Contact Gegevens</p>
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-black text-[var(--beheer-text)] uppercase tracking-tight">{signup.email}</p>
                                                                    <p className="text-xs font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{signup.phone_number || 'Geen telefoon'}</p>
                                                                </div>
                                                                <div className="pt-2">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Document: <span className="text-[var(--beheer-text)]">{signup.id_document === 'passport' ? 'Paspoort' : signup.id_document === 'id_card' ? 'ID Kaart' : (signup.id_document || '-')}</span></p>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Nummer: <span className="text-[var(--beheer-text)]">{signup.document_number || '-'}</span></p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)]">Medisch & Info</p>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-1">Allergieën</p>
                                                                    <p className="text-xs font-semibold text-[var(--beheer-text)]">{signup.allergies || 'Geen'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-1">Bijzonderheden</p>
                                                                    <p className="text-xs font-semibold text-[var(--beheer-text)]">{signup.special_notes || 'Geen'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)]">Activiteiten</p>
                                                                <div className="space-y-2">
                                                                    {signupActivitiesMap[signup.id] ? (
                                                                        signupActivitiesMap[signup.id].length > 0 ? (
                                                                            signupActivitiesMap[signup.id].map(a => (
                                                                                <div key={a.id} className="flex items-center gap-2">
                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--beheer-accent)]"></div>
                                                                                    <span className="text-xs font-black uppercase tracking-tight text-[var(--beheer-text)]">{a.trip_activity_id?.name || 'Activiteit'}</span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-xs text-[var(--beheer-text-muted)] italic">Geen selectie</p>
                                                                        )
                                                                    ) : (
                                                                        <p className="text-xs text-[var(--beheer-text-muted)] italic">Laden...</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
 
                                                        <div className="border-t border-[var(--beheer-border)]/50 pt-6 mt-6">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-4">Betaalverzoek Handmatig Versturen</p>
                                                            <div className="flex flex-wrap gap-3">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleResendPaymentEmail(signup.id, 'deposit'); }}
                                                                    disabled={sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'deposit'}
                                                                    className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signup.deposit_email_sent ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]' : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20'}`}
                                                                >
                                                                    {sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'deposit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                                    Aanbetaling {signup.deposit_email_sent && <span className="opacity-60">(OK)</span>}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleResendPaymentEmail(signup.id, 'final'); }}
                                                                    disabled={(sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'final') || !trip.allow_final_payments}
                                                                    className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signup.final_email_sent ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]' : 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border border-[var(--beheer-active)]/20 hover:bg-[var(--beheer-active)]/20'}`}
                                                                >
                                                                    {sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'final' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                                    Restbetaling {signup.final_email_sent && <span className="opacity-60">(OK)</span>}
                                                                </button>
                                                                {!trip.allow_final_payments && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-red-500/70 uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        Restbetalingen Gesloten
                                                                    </div>
                                                                )}
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
