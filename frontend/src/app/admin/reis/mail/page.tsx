'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { directusFetch } from '@/shared/lib/directus';
import { Loader2, Mail, Send, Users, CheckCircle2, XCircle, Filter } from 'lucide-react';

interface TripSignup {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    role: string;
    status: string;
    deposit_paid: boolean;
    full_payment_paid: boolean;
}

interface Trip {
    id: number;
    name: string;
}

export default function ReisMailPage() {
    const searchParams = useSearchParams();
    const tripIdParam = searchParams.get('trip');
    
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [signups, setSignups] = useState<TripSignup[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');
    
    // Form
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadTrips();
    }, []);

    useEffect(() => {
        if (tripIdParam) {
            setSelectedTripId(parseInt(tripIdParam));
        }
    }, [tripIdParam]);

    useEffect(() => {
        if (selectedTripId) {
            loadSignups();
        }
    }, [selectedTripId]);

    const loadTrips = async () => {
        try {
            const response = await directusFetch('/items/trips?fields=id,name&sort=-event_date') as Trip[];
            setTrips(response);
            if (response.length > 0 && !selectedTripId) {
                setSelectedTripId(response[0].id);
            }
        } catch (err) {
            console.error('Error loading trips:', err);
            setError('Fout bij het laden van reizen');
        }
    };

    const loadSignups = async () => {
        if (!selectedTripId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await directusFetch(
                `/items/trip_signups?filter[trip_id][_eq]=${selectedTripId}&fields=id,first_name,middle_name,last_name,email,role,status,deposit_paid,full_payment_paid&sort=last_name,first_name`
            ) as TripSignup[];
            setSignups(response);
        } catch (err) {
            console.error('Error loading signups:', err);
            setError('Fout bij het laden van aanmeldingen');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredRecipients = () => {
        return signups.filter(signup => {
            if (filterStatus !== 'all' && signup.status !== filterStatus) return false;
            if (filterRole !== 'all' && signup.role !== filterRole) return false;
            if (filterPayment === 'deposit_paid' && !signup.deposit_paid) return false;
            if (filterPayment === 'full_paid' && !signup.full_payment_paid) return false;
            if (filterPayment === 'unpaid' && signup.deposit_paid) return false;
            return true;
        });
    };

    const handleSendEmail = async () => {
        if (!selectedTripId || !subject.trim() || !message.trim()) {
            setError('Vul alle velden in');
            return;
        }

        const recipients = getFilteredRecipients();
        if (recipients.length === 0) {
            setError('Geen ontvangers gevonden met de huidige filters');
            return;
        }

        if (!confirm(`Je staat op het punt om een email te sturen naar ${recipients.length} deelnemer(s). Weet je het zeker?`)) {
            return;
        }

        setSending(true);
        setError(null);
        setSuccess(false);

        try {
            const trip = trips.find(t => t.id === selectedTripId);
            if (!trip) throw new Error('Trip not found');

            // Call backend to send bulk email
            const response = await fetch('/api/trip-email/send-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: selectedTripId,
                    tripName: trip.name,
                    recipients: recipients.map(r => ({ email: r.email, name: `${r.first_name} ${r.last_name}` })),
                    subject,
                    message
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send email');
            }

            setSuccess(true);
            setSubject('');
            setMessage('');
            
            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            console.error('Error sending email:', err);
            setError(err?.message || 'Fout bij het versturen van emails');
        } finally {
            setSending(false);
        }
    };

    const selectedTrip = trips.find(t => t.id === selectedTripId);
    const filteredRecipients = getFilteredRecipients();

    return (
        <>
            <PageHeader title="Reis Email Verzenden" backgroundImage="/img/backgrounds/committee.jpg" />
            
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <div className="flex items-center">
                            <XCircle className="h-6 w-6 text-red-600 mr-3" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <div className="flex items-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mr-3" />
                            <p className="text-green-700">Email succesvol verzonden naar {filteredRecipients.length} deelnemer(s)!</p>
                        </div>
                    </div>
                )}

                {/* Trip Selector */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecteer Reis
                    </label>
                    <select
                        value={selectedTripId || ''}
                        onChange={(e) => setSelectedTripId(parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        {trips.map((trip) => (
                            <option key={trip.id} value={trip.id}>
                                {trip.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <Filter className="h-5 w-5 text-purple-600 mr-2" />
                        <h2 className="text-lg font-bold text-gray-900">Ontvangers Filteren</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">Alle statussen</option>
                                <option value="registered">Geregistreerd</option>
                                <option value="confirmed">Bevestigd</option>
                                <option value="waitlist">Wachtlijst</option>
                                <option value="cancelled">Geannuleerd</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rol
                            </label>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">Alle rollen</option>
                                <option value="participant">Deelnemers</option>
                                <option value="crew">Crew</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Betaalstatus
                            </label>
                            <select
                                value={filterPayment}
                                onChange={(e) => setFilterPayment(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">Alle betalingen</option>
                                <option value="unpaid">Nog niet betaald</option>
                                <option value="deposit_paid">Aanbetaling voldaan</option>
                                <option value="full_paid">Volledig betaald</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center">
                            <Users className="h-5 w-5 text-purple-600 mr-2" />
                            <span className="text-sm font-medium text-purple-900">
                                {loading ? 'Laden...' : `${filteredRecipients.length} ontvanger(s) geselecteerd`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Email Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-6">
                        <Mail className="h-6 w-6 text-purple-600 mr-2" />
                        <h2 className="text-xl font-bold text-gray-900">Email Opstellen</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Onderwerp *
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Bijv. Belangrijke update over de reis"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bericht *
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={10}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Typ hier je bericht...&#10;&#10;De naam van de reis wordt automatisch toegevoegd aan de email."
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Tip: Gebruik enters voor alinea's. De layout wordt automatisch toegepast.
                            </p>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                            <p className="text-sm text-blue-700">
                                <strong>Let op:</strong> Deze email wordt verzonden naar {filteredRecipients.length} deelnemer(s) van {selectedTrip?.name}.
                                Controleer je bericht goed voordat je verstuurt.
                            </p>
                        </div>

                        <button
                            onClick={handleSendEmail}
                            disabled={sending || !subject.trim() || !message.trim() || filteredRecipients.length === 0}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                    Verzenden...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5 mr-2" />
                                    Email Versturen naar {filteredRecipients.length} Deelnemer(s)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
