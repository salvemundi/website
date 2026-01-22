'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Search, Download, Users, Plane, Mail, Edit, Trash2, Loader2, AlertCircle, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Trip {
    id: number;
    name: string;
    event_date: string;
    registration_open: boolean;
    max_participants: number;
    base_price: number;
    crew_discount: number;
    deposit_amount: number;
    is_bus_trip: boolean;
}

interface TripSignup {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string | null;
    id_document_type: string | null;
    allergies: string | null;
    special_notes: string | null;
    willing_to_drive: boolean | null;
    role: string;
    status: string;
    deposit_paid: boolean;
    deposit_paid_at: string | null;
    full_payment_paid: boolean;
    full_payment_paid_at: string | null;
    created_at: string;
}

export default function ReisAanmeldingenPage() {
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [signups, setSignups] = useState<TripSignup[]>([]);
    const [filteredSignups, setFilteredSignups] = useState<TripSignup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    useEffect(() => {
        loadTrips();
    }, []);

    useEffect(() => {
        if (selectedTrip) {
            loadSignups(selectedTrip.id);
        }
    }, [selectedTrip]);

    useEffect(() => {
        filterSignups();
    }, [signups, searchQuery, statusFilter, roleFilter]);

    const loadTrips = async () => {
        setIsLoading(true);
        try {
            const tripsData = await directusFetch<Trip[]>(
                '/items/trips?fields=id,name,event_date,registration_open,max_participants,base_price,crew_discount,deposit_amount,is_bus_trip&sort=-event_date'
            );
            setTrips(tripsData);

            // Select the most recent upcoming trip
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingTrip = tripsData.find(trip => {
                const tripDate = new Date(trip.event_date);
                tripDate.setHours(0, 0, 0, 0);
                return tripDate >= today;
            });

            if (upcomingTrip) {
                setSelectedTrip(upcomingTrip);
            } else if (tripsData.length > 0) {
                setSelectedTrip(tripsData[0]);
            }
        } catch (error) {
            console.error('Failed to load trips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSignups = async (tripId: number) => {
        setIsLoading(true);
        try {
            const signupsData = await directusFetch<TripSignup[]>(
                `/items/trip_signups?filter[trip_id][_eq]=${tripId}&fields=*&sort=-created_at`
            );
            setSignups(signupsData);
        } catch (error) {
            console.error('Failed to load signups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterSignups = () => {
        let filtered = [...signups];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(signup =>
                `${signup.first_name} ${signup.middle_name || ''} ${signup.last_name}`.toLowerCase().includes(query) ||
                signup.email.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(signup => signup.status === statusFilter);
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(signup => signup.role === roleFilter);
        }

        setFilteredSignups(filtered);
    };

    const getPaymentStatus = (signup: TripSignup) => {
        if (signup.full_payment_paid) {
            return { label: 'Volledig betaald', color: 'bg-green-100 text-green-800' };
        } else if (signup.deposit_paid) {
            return { label: 'Aanbetaling voldaan', color: 'bg-yellow-100 text-yellow-800' };
        } else {
            return { label: 'Nog geen betaling', color: 'bg-red-100 text-red-800' };
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            registered: { label: 'Geregistreerd', color: 'bg-blue-100 text-blue-800' },
            waitlist: { label: 'Wachtlijst', color: 'bg-orange-100 text-orange-800' },
            confirmed: { label: 'Bevestigd', color: 'bg-green-100 text-green-800' },
            cancelled: { label: 'Geannuleerd', color: 'bg-gray-100 text-gray-800' },
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    };

    const downloadExcel = () => {
        if (filteredSignups.length === 0) return;

        const excelData = filteredSignups.map(signup => ({
            'Voornaam': signup.first_name,
            'Tussenvoegsel': signup.middle_name || '',
            'Achternaam': signup.last_name,
            'Volledige naam': `${signup.first_name} ${signup.middle_name || ''} ${signup.last_name}`.trim(),
            'Email': signup.email,
            'Telefoonnummer': signup.phone_number,
            'Geboortedatum': signup.date_of_birth ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy') : '',
            'ID Type': signup.id_document_type || '',
            'Allergieën': signup.allergies || '',
            'Bijzonderheden': signup.special_notes || '',
            'Wil rijden': signup.willing_to_drive ? 'Ja' : 'Nee',
            'Rol': signup.role === 'crew' ? 'Crew' : 'Deelnemer',
            'Status': getStatusBadge(signup.status).label,
            'Betalingstatus': getPaymentStatus(signup).label,
            'Aanbetaling betaald op': signup.deposit_paid_at ? format(new Date(signup.deposit_paid_at), 'dd-MM-yyyy HH:mm') : '',
            'Volledige betaling op': signup.full_payment_paid_at ? format(new Date(signup.full_payment_paid_at), 'dd-MM-yyyy HH:mm') : '',
            'Aangemeld op': format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Aanmeldingen');

        // Set column widths
        const maxWidth = 50;
        const colWidths = Object.keys(excelData[0] || {}).map(key => ({
            wch: Math.min(maxWidth, Math.max(key.length, ...excelData.map(row => String(row[key as keyof typeof row] || '').length)))
        }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `reis-aanmeldingen-${selectedTrip?.name || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;

        try {
            await directusFetch(`/items/trip_signups/${id}`, { method: 'DELETE' });
            setSignups(signups.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete signup:', error);
            alert('Er is een fout opgetreden bij het verwijderen van de aanmelding.');
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const signup = signups.find(s => s.id === id);
            const oldStatus = signup?.status;

            await directusFetch(`/items/trip_signups/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            
            setSignups(signups.map(s => s.id === id ? { ...s, status: newStatus } : s));
            
            // Send email notification to participant
            if (signup && selectedTrip && oldStatus !== newStatus) {
                try {
                    await fetch('https://api.salvemundi.nl/trip-email/status-update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            signupId: id,
                            tripId: selectedTrip.id,
                            newStatus,
                            oldStatus
                        })
                    });
                } catch (emailErr) {
                    console.warn('Failed to send status update email:', emailErr);
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Er is een fout opgetreden bij het updaten van de status.');
        }
    };

    const stats = {
        total: signups.length,
        confirmed: signups.filter(s => s.status === 'confirmed' || s.status === 'registered').length,
        waitlist: signups.filter(s => s.status === 'waitlist').length,
        depositPaid: signups.filter(s => s.deposit_paid).length,
        fullPaid: signups.filter(s => s.full_payment_paid).length,
    };

    return (
        <>
            <PageHeader
                title="Reis Aanmeldingen"
                    // backgroundImage="/img/backgrounds/committees-bg.jpg"
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Trip Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Selecteer Reis
                    </label>
                    <select
                        value={selectedTrip?.id || ''}
                        onChange={(e) => {
                            const trip = trips.find(t => t.id === parseInt(e.target.value));
                            setSelectedTrip(trip || null);
                        }}
                        className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                        {trips.map(trip => (
                            <option key={trip.id} value={trip.id}>
                                {trip.name} - {format(new Date(trip.event_date), 'd MMMM yyyy', { locale: nl })}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Statistics */}
                {selectedTrip && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Totaal</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Bevestigd</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                                </div>
                                <UserCheck className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Wachtlijst</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.waitlist}</p>
                                </div>
                                <UserX className="h-8 w-8 text-orange-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Aanbetaling</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.depositPaid}</p>
                                </div>
                                <Plane className="h-8 w-8 text-yellow-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Volledig betaald</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.fullPaid}</p>
                                </div>
                                <Plane className="h-8 w-8 text-purple-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters and Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Zoek op naam of email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            >
                                <option value="all">Alle statussen</option>
                                <option value="registered">Geregistreerd</option>
                                <option value="confirmed">Bevestigd</option>
                                <option value="waitlist">Wachtlijst</option>
                                <option value="cancelled">Geannuleerd</option>
                            </select>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            >
                                <option value="all">Alle rollen</option>
                                <option value="participant">Deelnemer</option>
                                <option value="crew">Crew</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <button
                            onClick={() => router.push('/admin/reis/instellingen')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            <Edit className="h-5 w-5" />
                            Reis Instellingen
                        </button>

                        <button
                            onClick={() => router.push('/admin/reis/activiteiten')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <Plane className="h-5 w-5" />
                            Activiteiten Beheren
                        </button>

                        <button
                            onClick={downloadExcel}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-5 w-5" />
                            Export naar Excel
                        </button>

                        <button
                            onClick={() => router.push(`/admin/reis/mail${selectedTrip ? `?trip=${selectedTrip.id}` : ''}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Mail className="h-5 w-5" />
                            Mail alle deelnemers
                        </button>
                    </div>
                </div>

                {/* Signups Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : filteredSignups.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Geen aanmeldingen gevonden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Naam
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Geboortedatum
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rol
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Betalingstatus
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acties
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSignups.map(signup => {
                                        const paymentStatus = getPaymentStatus(signup);
                                        const statusBadge = getStatusBadge(signup.status);
                                        
                                        return (
                                            <tr key={signup.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {signup.first_name} {signup.middle_name} {signup.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{signup.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {signup.date_of_birth 
                                                        ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy')
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${signup.role === 'crew' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={signup.status}
                                                        onChange={(e) => handleStatusChange(signup.id, e.target.value)}
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${statusBadge.color}`}
                                                    >
                                                        <option value="registered">Geregistreerd</option>
                                                        <option value="confirmed">Bevestigd</option>
                                                        <option value="waitlist">Wachtlijst</option>
                                                        <option value="cancelled">Geannuleerd</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatus.color}`}>
                                                        {paymentStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => router.push(`/admin/reis/deelnemer/${signup.id}`)}
                                                        className="text-purple-600 hover:text-purple-900 mr-4"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(signup.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
