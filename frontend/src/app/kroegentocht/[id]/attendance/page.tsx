"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import qrService from '@/shared/lib/qr-service';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { Search, Camera, RefreshCw, X, CheckCircle, XCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface FlatParticipant {
    uniqueId: string; // signupId-index
    signupId: number;
    index: number;
    name: string;
    initial: string;
    email: string;
    association: string;
    checkedIn: boolean;
    checkedInAt: string | null;
    ticketCount: number; // Total in group
    _justToggled?: boolean;
}

export default function PubCrawlAttendancePage() {
    const params = useParams();
    const eventId = Number(params?.id);
    const { user } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [participants, setParticipants] = useState<FlatParticipant[]>([]);
    const [rawSignups, setRawSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [eventTitle, setEventTitle] = useState<string | null>(null);
    const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<{ name: string; status: 'success' | 'error'; message: string } | null>(null);
    const scannerRef = useRef<any>(null);
    const videoRef = useRef<HTMLDivElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await qrService.getPubCrawlSignupsWithCheckIn(eventId);
            setRawSignups(list);

            // Flatten signups to participants
            const flat: FlatParticipant[] = [];
            list.forEach((signup: any) => {
                let parts: any[] = [];
                try {
                    parts = signup.name_initials ? JSON.parse(signup.name_initials) : [];
                } catch (e) { parts = []; }

                // Fallback for old records without JSON or empty JSON
                if (parts.length === 0) {
                    parts = Array.from({ length: signup.amount_tickets }).map((_, i) => ({
                        name: i === 0 ? signup.name : `Deelnemer ${i + 1}`,
                        initial: '',
                        checked_in: !!signup.checked_in, // Legacy field fallback
                        checked_in_at: signup.checked_in_at
                    }));
                }

                parts.forEach((p, idx) => {
                    flat.push({
                        uniqueId: `${signup.id}-${idx}`,
                        signupId: signup.id,
                        index: idx,
                        name: p.name,
                        initial: p.initial,
                        email: signup.email,
                        association: signup.association,
                        checkedIn: !!p.checked_in,
                        checkedInAt: p.checked_in_at,
                        ticketCount: signup.amount_tickets
                    });
                });
            });
            setParticipants(flat);

        } catch (err) {
            console.error(err);
            showMessage('Kon inschrijvingen niet laden', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const check = async () => {
            if (!user) return;
            const ok = await qrService.isUserAuthorizedForPubCrawlAttendance(user.id);
            setAuthorized(ok);
            if (ok) await load();
        };
        check();
    }, [user, eventId]);

    // Load event title for header
    useEffect(() => {
        const loadTitle = async () => {
            try {
                const { directusFetch } = await import('@/shared/lib/directus');
                const data = await directusFetch<any>(`/items/pub_crawl_events/${eventId}?fields=id,name,image`);
                const title = data?.name || null;
                const img = data?.image || null;
                const imageUrl = img ? getImageUrl(img) : null;
                setEventTitle(title);
                setEventImageUrl(imageUrl);
            } catch (err) {
                console.error('Error loading event title:', err);
            }
        };
        if (eventId) loadTitle();
    }, [eventId]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const toggleCheckIn = async (participant: FlatParticipant) => {
        try {
            const signup = rawSignups.find(s => s.id === participant.signupId);
            if (!signup) return;

            let participantsData = [];
            try {
                participantsData = signup.name_initials ? JSON.parse(signup.name_initials) : [];
            } catch (e) { participantsData = []; }

            // Construct data if missing (migration on the fly)
            if (participantsData.length === 0) {
                participantsData = Array.from({ length: signup.amount_tickets }).map((_, i) => ({
                    name: i === 0 ? signup.name : `Deelnemer ${i + 1}`,
                    initial: '',
                    checked_in: !!signup.checked_in,
                    checked_in_at: signup.checked_in_at
                }));
            }

            // Update specific participant
            const idx = participant.index;
            if (idx >= participantsData.length) return; // Should not happen

            const newStatus = !participantsData[idx].checked_in;
            participantsData[idx].checked_in = newStatus;
            participantsData[idx].checked_in_at = newStatus ? new Date().toISOString() : null;

            // Also update legacy root field if ALL are checked in (optional, but keep consistent)
            const allCheckedIn = participantsData.every((p: any) => p.checked_in);

            const { directusFetch } = await import('@/shared/lib/directus');
            await directusFetch(`/items/pub_crawl_signups/${signup.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name_initials: JSON.stringify(participantsData),
                    checked_in: allCheckedIn, // Legacy update
                    checked_in_at: allCheckedIn ? new Date().toISOString() : null
                })
            });

            // Optimistic update
            setParticipants(prev => prev.map(p =>
                p.uniqueId === participant.uniqueId
                    ? { ...p, checkedIn: newStatus, checkedInAt: participantsData[idx].checked_in_at, _justToggled: true }
                    : p
            ));

            // Update raw signups to keep consistent for next toggles
            setRawSignups(prev => prev.map(s =>
                s.id === signup.id
                    ? { ...s, name_initials: JSON.stringify(participantsData), checked_in: allCheckedIn }
                    : s
            ));

            showMessage(newStatus ? 'Deelnemer ingecheckt!' : 'Check-in ongedaan gemaakt', 'success');

            setTimeout(() => {
                setParticipants(prev => prev.map(p => {
                    if (p.uniqueId === participant.uniqueId) {
                        const { _justToggled, ...rest } = p;
                        return rest;
                    }
                    return p;
                }));
            }, 700);

        } catch (err) {
            console.error(err);
            showMessage('Fout bij het wijzigen van check-in status', 'error');
        }
    };

    const handleScan = async (token: string) => {
        if (!token.trim()) return;
        const res = await qrService.checkInPubCrawlParticipant(token);

        if (res.success) {
            setScanResult({
                name: res.signup?.name || 'Gast',
                status: 'success',
                message: res.message || 'Succesvol ingecheckt!'
            });
            await load(); // Reload all data to refresh state
        } else {
            setScanResult({
                name: 'Unknown',
                status: 'error',
                message: res.message || 'Fout bij inchecken'
            });
        }

        setTimeout(() => setScanResult(null), 3000);
    };

    const startScanner = async () => {
        try {
            setScannerError(null);
            setShowScanner(true);
            const { Html5Qrcode } = await import('html5-qrcode');

            if (videoRef.current && !scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-reader');
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText: string) => {
                        await handleScan(decodedText);
                    },
                    (_errorMessage: string) => { }
                );
            }
        } catch (err: any) {
            console.error('Scanner error:', err);
            setScannerError(err?.message || 'Camera toegang geweigerd of niet beschikbaar');
            setShowScanner(false);
        }
    };

    const stopScanner = async () => {
        try {
            if (scannerRef.current) {
                await scannerRef.current.stop();
                scannerRef.current = null;
            }
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
        setShowScanner(false);
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    // Filter participants
    const filteredParticipants = participants.filter(p => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            p.name.toLowerCase().includes(query) ||
            p.email.toLowerCase().includes(query) ||
            p.association.toLowerCase().includes(query)
        );
    });

    const stats = {
        totalParticipants: participants.length,
        checkedIn: participants.filter(p => p.checkedIn).length,
        notCheckedIn: participants.filter(p => !p.checkedIn).length,
        groups: rawSignups.length
    };

    const exportToExcel = () => {
        const rows = filteredParticipants.map((p) => ({
            'Naam': `${p.name} ${p.initial}`,
            'Email': p.email || '-',
            'Vereniging': p.association || '-',
            'Ticket Index': p.index + 1,
            'Ingecheckt': p.checkedIn ? 'Ja' : 'Nee',
            'Ingecheckt op': p.checkedInAt ? new Date(p.checkedInAt).toLocaleString('nl-NL') : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aanwezigheid');

        ws['!cols'] = [
            { wch: 25 }, // Naam
            { wch: 30 }, // Email
            { wch: 20 }, // Vereniging
            { wch: 10 }, // Index
            { wch: 12 }, // Ingecheckt
            { wch: 20 }, // Ingecheckt op
        ];

        const filename = `kroegentocht-aanwezigheid-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <p>Inloggen vereist</p>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <p>Geen toegang</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
            <PageHeader
                title={eventTitle ? `Aanwezigheid: ${eventTitle}` : 'Aanwezigheid beheren'}
                backgroundImage={eventImageUrl || '/img/backgrounds/Kroto2025.jpg'}
            />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl shadow-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        <span className="font-semibold">{message.text}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end rounded-2xl p-4 shadow-lg text-white">
                        <p className="text-sm font-semibold opacity-80">Deelnemers</p>
                        <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 shadow-lg text-white">
                        <p className="text-sm font-semibold opacity-80">Ingecheckt</p>
                        <p className="text-2xl font-bold">{stats.checkedIn}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 shadow-lg text-white">
                        <p className="text-sm font-semibold opacity-80">Niet Ingecheckt</p>
                        <p className="text-2xl font-bold">{stats.notCheckedIn}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 shadow-lg text-white">
                        <p className="text-sm font-semibold opacity-80">Groepen</p>
                        <p className="text-2xl font-bold">{stats.groups}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button onClick={load} className="action-btn bg-white dark:bg-gray-800 text-theme-purple p-3 rounded-xl shadow font-semibold flex items-center gap-2">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> Ververs
                    </button>
                    <button onClick={exportToExcel} className="action-btn bg-white dark:bg-gray-800 text-green-600 p-3 rounded-xl shadow font-semibold flex items-center gap-2">
                        <Download className="h-5 w-5" /> Excel
                    </button>
                    <button onClick={showScanner ? stopScanner : startScanner} className={`action-btn p-3 rounded-xl shadow font-semibold flex items-center gap-2 text-white ${showScanner ? 'bg-red-500' : 'bg-theme-purple'}`}>
                        {showScanner ? <X className="h-5 w-5" /> : <Camera className="h-5 w-5" />} {showScanner ? 'Sluit' : 'Camera'}
                    </button>
                </div>

                {/* Scanner Error */}
                {scannerError && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
                        <p className="font-semibold">Camera fout:</p>
                        <p>{scannerError}</p>
                    </div>
                )}

                {/* Scanner View */}
                {showScanner && (
                    <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow relative">
                        <div id="qr-reader" ref={videoRef} className="rounded-xl overflow-hidden max-w-md mx-auto"></div>
                        {scanResult && (
                            <div className={`absolute top-4 left-4 right-4 p-4 rounded-xl text-white shadow-xl ${scanResult.status === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                                <p className="font-bold text-lg">{scanResult.name}</p>
                                <p>{scanResult.message}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Zoek op naam..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-theme-purple text-white">
                            <tr>
                                <th className="px-4 py-3 text-left">Naam</th>
                                <th className="px-4 py-3 text-left hidden sm:table-cell">Ticket</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredParticipants.map(p => (
                                <tr key={p.uniqueId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3">
                                        <p className="font-bold">{p.name} {p.initial}</p>
                                        <p className="text-xs text-gray-500">{p.email}</p>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        Ticket {p.index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {p.checkedIn ?
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Ingecheckt</span> :
                                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">Nee</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => toggleCheckIn(p)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-transform ${p.checkedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} ${p._justToggled ? 'scale-110' : ''}`}
                                        >
                                            {p.checkedIn ? 'Uit' : 'In'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredParticipants.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Geen deelnemers gevonden</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </main>
        </div>
    );
}
