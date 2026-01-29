'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import { useAuth } from '@/features/auth/providers/auth-provider';
import NoAccessPage from '@/app/admin/no-access/page';
import { isUserAuthorizedForReis } from '@/shared/lib/committee-utils';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { siteSettingsMutations } from '@/shared/lib/api/salvemundi';
import { useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { Search, Download, Users, Plane, Edit, Trash2, Loader2, AlertCircle, UserCheck, UserX, Send } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { tripSignupActivitiesApi } from '@/shared/lib/api/salvemundi';

interface Trip {
    id: number;
    name: string;
    event_date: string;
    start_date?: string;
    end_date?: string;
    registration_open: boolean;
    max_participants: number;
    base_price: number;
    crew_discount: number;
    deposit_amount: number;
    is_bus_trip: boolean;
    allow_final_payments?: boolean;
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
    document_number: string | null;
    allergies: string | null;
    special_notes: string | null;
    willing_to_drive: boolean | null;
    role: string;
    status: string;
    deposit_paid: boolean;
    deposit_paid_at: string | null;
    full_payment_paid: boolean;
    full_payment_paid_at: string | null;
    deposit_email_sent?: boolean;
    final_email_sent?: boolean;
    created_at: string;
}

export default function ReisAanmeldingenPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [signups, setSignups] = useState<TripSignup[]>([]);
    const [filteredSignups, setFilteredSignups] = useState<TripSignup[]>([]);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [signupActivitiesMap, setSignupActivitiesMap] = useState<Record<number, { id: number; name: string; price: number }[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);
    // Site visibility settings for Reis
    const { data: reisSettings, refetch: refetchReisSettings } = useSalvemundiSiteSettings('reis');

    useEffect(() => {
        loadTrips();
    }, []);

    // Authorization: only allow members of reiscommissie, ict commissie or bestuur
    useEffect(() => {
        if (authLoading) return;
        setIsAuthorized(isUserAuthorizedForReis(user));
    }, [user, authLoading]);

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
                '/items/trips?fields=id,name,event_date,start_date,end_date,registration_open,max_participants,base_price,crew_discount,deposit_amount,is_bus_trip,allow_final_payments&sort=-event_date'
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
            return { label: 'Volledig betaald', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
        } else if (signup.deposit_paid) {
            return { label: 'Aanbetaling voldaan', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
        } else {
            return { label: 'Nog geen betaling', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            registered: { label: 'Geregistreerd', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            waitlist: { label: 'Wachtlijst', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
            confirmed: { label: 'Bevestigd', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
            cancelled: { label: 'Geannuleerd', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    };

    const downloadExcel = async () => {
        if (filteredSignups.length === 0) return;

        // Clone current map to avoid mutating state directly during calculation
        let currentMap = { ...signupActivitiesMap };

        // Ensure all activities for filtered signups are loaded
        const missingIds = filteredSignups
            .filter(s => !currentMap[s.id])
            .map(s => s.id);

        if (missingIds.length > 0) {
            try {
                // Fetch all activities for missing signups in one go
                const allActivities = await directusFetch<any[]>(
                    `/items/trip_signup_activities?filter[trip_signup_id][_in]=${missingIds.join(',')}&fields=trip_signup_id,trip_activity_id.*,selected_options`
                );

                allActivities.forEach(it => {
                    const signupId = it.trip_signup_id;
                    if (!currentMap[signupId]) currentMap[signupId] = [];

                    const a = it.trip_activity_id;
                    if (!a) return;

                    let activityName = a.name || a.title || '';
                    let activityPrice = Number(a.price) || 0;

                    const selectedOptions = it.selected_options;
                    if (selectedOptions && Array.isArray(selectedOptions) && a.options) {
                        const addedOptions: string[] = [];
                        selectedOptions.forEach((optName: string) => {
                            const optDef = a.options.find((o: any) => o.name === optName);
                            if (optDef) {
                                activityPrice += Number(optDef.price) || 0;
                                addedOptions.push(optName);
                            }
                        });
                        if (addedOptions.length > 0) {
                            activityName += ` (+ ${addedOptions.join(', ')})`;
                        }
                    }
                    currentMap[signupId].push({ id: a.id, name: activityName, price: activityPrice });
                });

                // Update state for future use
                setSignupActivitiesMap(currentMap);
            } catch (err) {
                console.error('Failed to pre-fetch activities for export:', err);
            }
        }

        const excelData = filteredSignups.map(signup => {
            const idDoc = signup.id_document_type || (signup as any).id_document || '';
            const idDocLabel = idDoc === 'passport' ? 'Paspoort' : idDoc === 'id_card' ? 'ID Kaart' : idDoc;

            const activities = currentMap[signup.id] || [];
            const activitiesStr = activities.map(a => a.name).join(', ');

            return {
                'Voornaam': signup.first_name,
                'Tussenvoegsel': signup.middle_name || '',
                'Achternaam': signup.last_name,
                'Volledige naam': `${signup.first_name} ${signup.middle_name || ''} ${signup.last_name}`.trim(),
                'Email': signup.email,
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

    const handleResendPaymentEmail = async (signupId: number, paymentType: 'deposit' | 'final') => {
        if (!selectedTrip) return;

        const signup = signups.find(s => s.id === signupId);
        if (!signup) return;

        // Validation checks
        if (paymentType === 'deposit' && signup.deposit_paid) {
            if (!confirm('Deze persoon heeft de aanbetaling al betaald. Wil je toch een betaalverzoek sturen?')) {
                return;
            }
        }

        if (paymentType === 'final' && !signup.deposit_paid) {
            alert('Deze persoon heeft de aanbetaling nog niet betaald. Stuur eerst een aanbetalingsverzoek.');
            return;
        }

        if (paymentType === 'final' && signup.full_payment_paid) {
            if (!confirm('Deze persoon heeft al volledig betaald. Wil je toch een betaalverzoek sturen?')) {
                return;
            }
        }

        setSendingEmailTo({ signupId, type: paymentType });

        try {
            const response = await fetch('/api/trip-email/payment-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signupId: signupId,
                    tripId: selectedTrip.id,
                    paymentType: paymentType
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send email');
            }

            alert(`${paymentType === 'deposit' ? 'Aanbetaling' : 'Restbetaling'}sverzoek is succesvol verzonden naar ${signup.email}`);

            // Update local state to reflect email sent
            setSignups(prev => prev.map(s => s.id === signupId ? {
                ...s,
                [paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent']: true
            } : s));
        } catch (error: any) {
            console.error('Failed to send payment email:', error);
            alert(`Er is een fout opgetreden bij het verzenden van de email: ${error.message}`);
        } finally {
            setSendingEmailTo(null);
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        const signup = signups.find(s => s.id === id);

        // Confirmation for sending email when switching to confirmed without payment
        if (signup && newStatus === 'confirmed' && !signup.deposit_paid) {
            if (!confirm(`Let op: Door de status naar 'Bevestigd' te wijzigen, wordt er automatisch een e-mail met het aanbetalingsverzoek naar ${signup.first_name} gestuurd.\n\nWeet je zeker dat je door wilt gaan?`)) {
                return;
            }
        }

        try {
            const oldStatus = signup?.status;

            await directusFetch(`/items/trip_signups/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            setSignups(signups.map(s => s.id === id ? { ...s, status: newStatus } : s));

            // Send email notification to participant
            if (signup && selectedTrip && oldStatus !== newStatus) {
                try {
                    // Always send status update email
                    await fetch('/api/trip-email/status-update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            signupId: id,
                            tripId: selectedTrip.id,
                            newStatus,
                            oldStatus
                        })
                    });

                    // If changed to confirmed, ALSO send the deposit payment request
                    if (newStatus === 'confirmed' && !signup.deposit_paid) {
                        console.log('[handleStatusChange] Auto-triggering deposit payment request email');
                        await fetch('/api/trip-email/payment-request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                signupId: id,
                                tripId: selectedTrip.id,
                                paymentType: 'deposit'
                            })
                        });
                        // Update local state to reflect email sent
                        setSignups(prev => prev.map(s => s.id === id ? { ...s, deposit_email_sent: true } : s));
                    }
                } catch (emailErr) {
                    console.warn('Failed to send status update or payment request email:', emailErr);
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

    const toggleExpand = async (signup: TripSignup) => {
        // collapse if already expanded
        if (expandedIds.includes(signup.id)) {
            setExpandedIds(prev => prev.filter(id => id !== signup.id));
            return;
        }

        // expand
        setExpandedIds(prev => [...prev, signup.id]);

        // load activities for this signup if not loaded yet
        if (!signupActivitiesMap[signup.id]) {
            try {
                const items = await tripSignupActivitiesApi.getBySignupId(signup.id);
                const activities = items.map((it: any) => {
                    const a = it.trip_activity_id && it.trip_activity_id.id ? it.trip_activity_id : it.trip_activity_id;
                    let activityName = a.name || '';
                    let activityPrice = Number(a.price) || 0;

                    const selectedOptions = it.selected_options;
                    if (selectedOptions && Array.isArray(selectedOptions) && a.options) {
                        const addedOptions: string[] = [];
                        selectedOptions.forEach((optName: string) => {
                            const optDef = a.options.find((o: any) => o.name === optName);
                            if (optDef) {
                                activityPrice += Number(optDef.price) || 0;
                                addedOptions.push(optName);
                            }
                        });
                        if (addedOptions.length > 0) {
                            activityName += ` (+ ${addedOptions.join(', ')})`;
                        }
                    }

                    return { id: a.id || a, name: activityName, price: activityPrice };
                });
                setSignupActivitiesMap(prev => ({ ...prev, [signup.id]: activities }));
            } catch (err) {
                console.error('Failed to load signup activities:', err);
                setSignupActivitiesMap(prev => ({ ...prev, [signup.id]: [] }));
            }
        }
    };

    if (authLoading || isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            </div>
        );
    }

    if (!isAuthorized) {
        return <NoAccessPage />;
    }

    return (
        <>
            <PageHeader
                title="Reis Aanmeldingen"
            // backgroundImage="/img/backgrounds/committees-bg.jpg"
            />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Trip Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-admin-muted mb-2">
                        Selecteer Reis
                    </label>
                    <select
                        value={selectedTrip?.id || ''}
                        onChange={(e) => {
                            const trip = trips.find(t => t.id === parseInt(e.target.value));
                            setSelectedTrip(trip || null);
                        }}
                        className="w-full md:w-auto px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                    >
                        {trips.map(trip => {
                            const displayStartDate = trip.start_date || trip.event_date;
                            const dateDisplay = trip.end_date
                                ? `${format(new Date(displayStartDate), 'd MMMM yyyy', { locale: nl })} - ${format(new Date(trip.end_date), 'd MMMM yyyy', { locale: nl })}`
                                : format(new Date(displayStartDate), 'd MMMM yyyy', { locale: nl });
                            return (
                                <option key={trip.id} value={trip.id}>
                                    {trip.name} - {dateDisplay}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Statistics */}
                {selectedTrip && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
                        <div className="bg-admin-card rounded-lg shadow p-4 sm:p-4 sm:p-6 border-l-4 border-blue-500">
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
                )}

                {/* Filters and Actions */}
                <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-admin-muted h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Zoek op naam of email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
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

                        {/* Role Filter */}
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

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-4">
                        <button
                            onClick={() => router.push('/admin/reis/instellingen')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition w-full sm:w-auto"
                        >
                            <Edit className="h-5 w-5" />
                            Reis Instellingen
                        </button>

                        {/* Visibility toggle for Reis (only shown to users who can manage Reis; permission check is earlier) */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                            <label className="text-sm font-medium">Reis zichtbaar</label>
                            <button
                                onClick={async () => {
                                    const current = reisSettings?.show ?? true;
                                    try {
                                        await siteSettingsMutations.upsertByPage('reis', { show: !current });
                                        await refetchReisSettings();
                                    } catch (err) {
                                        console.error('Failed to toggle reis visibility', err);
                                        alert('Fout bij het bijwerken van de zichtbaarheid voor Reis');
                                    }
                                }}
                                className={`w-12 h-6 rounded-full p-0.5 transition ${reisSettings?.show ? 'bg-green-500' : 'bg-gray-300'}`}
                                aria-pressed={reisSettings?.show ?? true}
                            >
                                <span className={`block w-5 h-5 bg-white rounded-full transform transition ${reisSettings?.show ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <button
                            onClick={() => router.push('/admin/reis/activiteiten')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto">
                            <Plane className="h-5 w-5" />
                            Activiteiten Beheren
                        </button>

                        <button
                            onClick={downloadExcel}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
                            <Download className="h-5 w-5" />
                            Export naar Excel
                        </button>
                    </div>
                </div>

                {/* Signups Table */}
                <div className="bg-admin-card rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-theme-purple" />
                        </div>
                    ) : filteredSignups.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-admin-muted mx-auto mb-4" />
                            <p className="text-admin-muted">Geen aanmeldingen gevonden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-admin-card-soft border-b border-admin">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                                            Naam
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden sm:table-cell">
                                            Geboortedatum
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden md:table-cell">
                                            Rol
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden sm:table-cell">
                                            Betalingstatus
                                        </th>
                                        <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-admin-muted uppercase tracking-wider">
                                            Acties
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-admin-card divide-y divide-admin">
                                    {filteredSignups.map(signup => {
                                        const paymentStatus = getPaymentStatus(signup);
                                        const statusBadge = getStatusBadge(signup.status);

                                        return (
                                            <Fragment key={signup.id}>
                                                <tr key={signup.id} onClick={() => toggleExpand(signup)} className="hover:bg-admin-hover cursor-pointer">
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        <div className="text-xs sm:text-sm font-medium text-admin">
                                                            {signup.first_name} {signup.middle_name} {signup.last_name}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-admin-muted">{signup.email}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-admin hidden sm:table-cell">
                                                        {signup.date_of_birth
                                                            ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy')
                                                            : '-'}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${signup.role === 'crew' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                            {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
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
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatus.color}`}>
                                                            {paymentStatus.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-1 sm:gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); router.push(`/admin/reis/deelnemer/${signup.id}`); }}
                                                                className="text-theme-purple hover:text-theme-purple-dark p-1 sm:p-0"
                                                                title="Bewerken"
                                                            >
                                                                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(signup.id); }}
                                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 sm:p-0"
                                                                title="Verwijderen"
                                                            >
                                                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleExpand(signup); }}
                                                                className="text-admin-muted hover:text-admin p-1 sm:p-0"
                                                                title="Toon details"
                                                            >
                                                                <span className="text-xs sm:text-sm">{expandedIds.includes(signup.id) ? '▲' : '▼'}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedIds.includes(signup.id) && (
                                                    <tr key={`details-${signup.id}`} className="bg-admin-card-soft">
                                                        <td colSpan={6} className="px-6 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-admin">Contact</p>
                                                                    <p className="text-sm text-admin">{signup.email}</p>
                                                                    <p className="text-sm text-admin">{signup.phone_number || '-'}</p>
                                                                    <p className="text-sm text-admin">ID Type: {(signup.id_document_type || (signup as any).id_document) === 'passport' ? 'Paspoort' : (signup.id_document_type || (signup as any).id_document) === 'id_card' ? 'ID Kaart' : ((signup.id_document_type || (signup as any).id_document) || '-')}</p>
                                                                    <p className="text-sm text-admin">Document nummer: {signup.document_number || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-admin">Extra informatie</p>
                                                                    <p className="text-sm text-admin">Allergieën: {signup.allergies || (signup as any).alergies || '-'}</p>
                                                                    <p className="text-sm text-admin">Bijzonderheden: {signup.special_notes || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-admin">Activiteiten</p>
                                                                    {signupActivitiesMap[signup.id] ? (
                                                                        signupActivitiesMap[signup.id].length > 0 ? (
                                                                            signupActivitiesMap[signup.id].map(a => (
                                                                                <div key={a.id} className="flex items-center justify-between text-sm text-admin">
                                                                                    <span>{a.name}</span>
                                                                                    <span className="font-semibold">€{Number(a.price).toFixed(2)}</span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-sm text-admin-muted">Geen activiteiten</p>
                                                                        )
                                                                    ) : (
                                                                        <p className="text-sm text-admin-muted">Laden...</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Email buttons */}
                                                            <div className="border-t border-admin pt-4 mt-4">
                                                                <p className="text-sm font-semibold text-admin mb-2">Betaalverzoek versturen</p>
                                                                <div className="flex gap-2">
                                                                    <div className="flex flex-col gap-1 items-start">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleResendPaymentEmail(signup.id, 'deposit');
                                                                            }}
                                                                            disabled={sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'deposit'}
                                                                            className={`flex items-center gap-2 px-4 py-2 ${signup.deposit_email_sent ? 'bg-admin-hover text-admin' : 'bg-yellow-600 text-white'} text-sm rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                        >
                                                                            {sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'deposit' ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Send className="h-4 w-4" />
                                                                            )}
                                                                            Aanbetaling {signup.deposit_email_sent && <span className="ml-1 text-[10px] font-bold uppercase opacity-60">(Verzonden)</span>}
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1 items-start">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleResendPaymentEmail(signup.id, 'final');
                                                                            }}
                                                                            disabled={(sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'final') || !selectedTrip?.allow_final_payments}
                                                                            className={`flex items-center gap-2 px-4 py-2 ${signup.final_email_sent ? 'bg-admin-hover text-admin' : 'bg-green-600 text-white'} text-sm rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                            title={!selectedTrip?.allow_final_payments ? 'Restbetalingen zijn nog niet opengesteld voor deze reis' : ''}
                                                                        >
                                                                            {sendingEmailTo?.signupId === signup.id && sendingEmailTo?.type === 'final' ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Send className="h-4 w-4" />
                                                                            )}
                                                                            Restbetaling {signup.final_email_sent && <span className="ml-1 text-[10px] font-bold uppercase opacity-60">(Verzonden)</span>}
                                                                        </button>
                                                                        {!selectedTrip?.allow_final_payments && <span className="text-[10px] text-red-500 italic mt-1 leading-tight">Restbetalingen nog niet geopend</span>}
                                                                    </div>
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
            </div>
        </>
    );
}
