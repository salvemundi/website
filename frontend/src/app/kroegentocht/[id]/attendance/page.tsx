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
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';
import { directusFetch } from '@/shared/lib/directus';

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
    signupName: string; // The name from the signup
    _justToggled?: boolean;
}

const ASSOCIATIONS = [
    'Salve Mundi',
    'Proxy',
    'Prick',
    'Young Financials',
    'Glow',
    'Socialis',
    'Topsy',
    'Watoto',
    'Bge',
    'Fact',
    'Fpsa',
    'Averroes',
    'Paramedisch',
    'Planck',
    'Pac',
    'Anders'
];

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
    const [emailQuery, setEmailQuery] = useState('');
    const [associationQuery, setAssociationQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<{ name: string; status: 'success' | 'error'; message: string } | null>(null);
    const scannerRef = useRef<any>(null);
    const videoRef = useRef<HTMLDivElement>(null);
    const scanLockRef = useRef<boolean>(false);
    const SCAN_LOCK_MS = 3000;


    const load = async () => {
        setLoading(true);
        try {
            const list = await qrService.getPubCrawlSignupsWithCheckIn(eventId);
            setRawSignups(list);

            // Group by signupId to calculate index
            const ticketsBySignup: Record<number, any[]> = {};
            list.forEach((t: any) => {
                const sid = t[FIELDS.TICKETS.SIGNUP_ID]?.id || 0;
                if (!ticketsBySignup[sid]) ticketsBySignup[sid] = [];
                ticketsBySignup[sid].push(t);
            });

            // Flatten/Map tickets to participants
            const flat: FlatParticipant[] = list.map((ticket: any) => {
                const signup = ticket[FIELDS.TICKETS.SIGNUP_ID];
                const signupTickets = ticketsBySignup[signup?.id || 0] || [];
                const idx = signupTickets.findIndex(t => t.id === ticket.id);

                return {
                    uniqueId: String(ticket.id),
                    signupId: signup?.id || 0,
                    index: idx >= 0 ? idx : 0,
                    name: ticket[FIELDS.TICKETS.NAME],
                    initial: ticket[FIELDS.TICKETS.INITIAL],
                    email: signup?.[FIELDS.SIGNUPS.EMAIL] || '',
                    association: signup?.[FIELDS.SIGNUPS.ASSOCIATION] || '',
                    checkedIn: !!ticket[FIELDS.TICKETS.CHECKED_IN],
                    checkedInAt: ticket[FIELDS.TICKETS.CHECKED_IN_AT],
                    ticketCount: signupTickets.length,
                    signupName: signup?.[FIELDS.SIGNUPS.NAME] || ''
                };
            });

            // Sort by email, then index
            flat.sort((a, b) => {
                const emailComp = a.email.localeCompare(b.email);
                if (emailComp !== 0) return emailComp;
                return a.index - b.index;
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
        if (eventId && authorized) loadTitle();
    }, [eventId, authorized]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const toggleCheckIn = async (participant: FlatParticipant) => {
        try {
            const ticket = rawSignups.find(t => String(t.id) === participant.uniqueId);
            if (!ticket) return;

            const newStatus = !ticket[FIELDS.TICKETS.CHECKED_IN];
            const checkedInAt = newStatus ? new Date().toISOString() : null;

            await directusFetch(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}/${ticket.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    [FIELDS.TICKETS.CHECKED_IN]: newStatus,
                    [FIELDS.TICKETS.CHECKED_IN_AT]: checkedInAt
                })
            });

            // Optimistic update
            setParticipants(prev => prev.map(p =>
                p.uniqueId === participant.uniqueId
                    ? { ...p, checkedIn: newStatus, checkedInAt: checkedInAt, _justToggled: true }
                    : p
            ));

            // Update raw tickets
            setRawSignups(prev => prev.map(t =>
                String(t.id) === participant.uniqueId
                    ? { ...t, [FIELDS.TICKETS.CHECKED_IN]: newStatus, [FIELDS.TICKETS.CHECKED_IN_AT]: checkedInAt }
                    : t
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
        // popup visibility handled by scanner lock timeout
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
                        // Prevent rapid repeated scans by locking for a short timeout
                        if (scanLockRef.current) return;
                        scanLockRef.current = true;
                        try {
                            await handleScan(decodedText);
                        } finally {
                            // keep popup visible for the same duration as the scan lock
                            setTimeout(() => { scanLockRef.current = false; setScanResult(null); }, SCAN_LOCK_MS);
                        }
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
        const matchesSearch = !searchQuery.trim() ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesEmail = !emailQuery.trim() ||
            p.email.toLowerCase().includes(emailQuery.toLowerCase());

        const matchesAssociation = !associationQuery.trim() ||
            p.association.toLowerCase().includes(associationQuery.toLowerCase());

        return matchesSearch && matchesEmail && matchesAssociation;
    });

    const stats = {
        totalParticipants: participants.length,
        checkedIn: participants.filter(p => p.checkedIn).length,
        notCheckedIn: participants.filter(p => !p.checkedIn).length,
        groups: Array.from(new Set(participants.map(p => p.signupId))).length
    };

    const exportToExcel = () => {
        // Calculate group numbers based on sorted unique signupIds to ensure consistency
        const uniqueSignupIds = Array.from(new Set(filteredParticipants.map(p => p.signupId))).sort((a, b) => a - b);
        const signupIdToGroupNumber = new Map<number, number>();
        uniqueSignupIds.forEach((id, index) => {
            signupIdToGroupNumber.set(id, index + 1);
        });

        const rows = filteredParticipants.map((p) => ({
            'Groep': `Groep ${signupIdToGroupNumber.get(p.signupId)}`,
            'Naam': `${p.name} ${p.initial}`,
            'Email': p.email || '-',
            'Vereniging': p.association || '-',
            'Ingecheckt': p.checkedIn ? 'Ja' : 'Nee',
            'Ingecheckt op': p.checkedInAt ? new Date(p.checkedInAt).toLocaleString('nl-NL') : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aanwezigheid');

        ws['!cols'] = [
            { wch: 15 }, // Groep
            { wch: 25 }, // Naam
            { wch: 30 }, // Email
            { wch: 20 }, // Vereniging
            { wch: 12 }, // Ingecheckt
            { wch: 20 }, // Ingecheckt op
        ];

        const filename = `kroegentocht-aanwezigheid-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    // Grouping logic for rendering
    const groupedParticipants: { email: string; participants: FlatParticipant[] }[] = [];
    filteredParticipants.forEach(p => {
        let group = groupedParticipants.find(g => g.email === p.email);
        if (!group) {
            group = { email: p.email, participants: [] };
            groupedParticipants.push(group);
        }
        group.participants.push(p);
    });

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
        <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-main)' }}>
            <PageHeader
                title={eventTitle ? `${eventTitle}\nAanwezigheid` : 'Aanwezigheid beheren'}
                backgroundImage={eventImageUrl || '/img/backgrounds/intro-banner.jpg'}
                backLink="/admin/kroegentocht"
            />

            <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
                {message && (
                    <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        <span className="font-bold">{message.text}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-[var(--bg-card)] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col items-center justify-center text-center">
                        <p className="text-xs sm:text-sm font-semibold text-theme-muted uppercase tracking-wider mb-1">Deelnemers</p>
                        <p className="text-2xl sm:text-3xl font-black text-theme-purple dark:text-white">{stats.totalParticipants}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col items-center justify-center text-center">
                        <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Ingecheckt</p>
                        <p className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">{stats.checkedIn}</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col items-center justify-center text-center">
                        <p className="text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">Nog niet</p>
                        <p className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">{stats.notCheckedIn}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col items-center justify-center text-center">
                        <p className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Groepen</p>
                        <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{stats.groups}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
                    <button onClick={load} className="flex-1 sm:flex-none action-btn bg-[var(--bg-card)] dark:border dark:border-white/10 text-theme-purple dark:text-white p-3.5 rounded-2xl shadow-md font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> Ververs
                    </button>
                    <button onClick={exportToExcel} className="flex-1 sm:flex-none action-btn bg-[var(--bg-card)] dark:border dark:border-white/10 text-green-600 dark:text-green-400 p-3.5 rounded-2xl shadow-md font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                        <Download className="h-5 w-5" /> Excel
                    </button>
                    <button onClick={showScanner ? stopScanner : startScanner} className={`w-full sm:flex-none action-btn p-3.5 rounded-2xl shadow-lg font-bold flex items-center justify-center gap-2 text-white transition-all active:scale-95 ${showScanner ? 'bg-red-500 hover:bg-red-600' : 'bg-theme-purple hover:bg-theme-purple-dark'}`}>
                        {showScanner ? <X className="h-5 w-5" /> : <Camera className="h-5 w-5" />} {showScanner ? 'Stop Scanner' : 'Open Scanner'}
                    </button>
                </div>

                {/* Scanner Error */}
                {scannerError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl">
                        <p className="font-bold flex items-center gap-2"><XCircle className="h-5 w-5" /> Camera Fout</p>
                        <p className="text-sm mt-1">{scannerError}</p>
                    </div>
                )}

                {/* Scanner View */}
                {showScanner && (
                    <div className="mb-6 sm:mb-8 bg-black rounded-3xl overflow-hidden shadow-2xl relative max-w-2xl mx-auto aspect-square">
                        <div id="qr-reader" ref={videoRef} className="w-full h-full"></div>
                        {scanResult && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => { setScanResult(null); scanLockRef.current = false; }}
                                className={`absolute inset-x-4 top-4 z-50 p-6 rounded-2xl text-white shadow-2xl animate-in zoom-in duration-300 flex flex-col items-center text-center cursor-pointer ${scanResult.status === 'success' ? 'bg-green-600/90 backdrop-blur-md' : 'bg-red-600/90 backdrop-blur-md'}`}>
                                <p className="font-black text-2xl mb-1">{scanResult.name}</p>
                                <p className="font-medium">{scanResult.message}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-3xl pointer-events-none box-content"></div>
                    </div>
                )}

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-theme-purple transition-colors" />
                        <input
                            type="text"
                            placeholder="Zoek op naam..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-[var(--bg-card)] dark:text-white focus:outline-none focus:ring-4 focus:ring-theme-purple/10 focus:border-theme-purple transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-theme-purple transition-colors" />
                        <input
                            type="text"
                            placeholder="Zoek op email..."
                            value={emailQuery}
                            onChange={(e) => setEmailQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-[var(--bg-card)] dark:text-white focus:outline-none focus:ring-4 focus:ring-theme-purple/10 focus:border-theme-purple transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative group">
                        <select
                            value={associationQuery}
                            onChange={(e) => setAssociationQuery(e.target.value)}
                            className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-[var(--bg-card)] dark:text-white focus:outline-none focus:ring-4 focus:ring-theme-purple/10 focus:border-theme-purple transition-all shadow-sm appearance-none"
                        >
                            <option value="">Alle verenigingen</option>
                            {ASSOCIATIONS.map(assoc => (
                                <option key={assoc} value={assoc}>{assoc}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-6">
                    {groupedParticipants.map((group) => (
                        <div key={group.email} className="bg-[var(--bg-card)] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                            {/* Group Header */}
                            <div className="bg-gradient-to-r from-theme-purple to-theme-purple-dark px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col">
                                    <h3 className="text-white font-black text-lg tracking-tight leading-tight">
                                        Groep: {group.participants[0].signupName}
                                    </h3>
                                    <p className="text-white/70 text-sm font-medium">{group.email}</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-center">
                                    <span className="text-white text-xs font-black uppercase">{group.participants.length} Tickets</span>
                                </div>
                            </div>

                            {/* Group Table */}
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {group.participants.map((p) => (
                                        <tr key={p.uniqueId} className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors ${p.checkedIn ? 'opacity-80' : ''}`}>
                                            <td className="px-5 sm:px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{p.name} {p.initial}</span>
                                                    {p.association && (
                                                        <span className="text-xs font-black text-theme-purple/80 dark:text-theme-purple-light uppercase tracking-widest mt-0.5">
                                                            {p.association}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 hidden sm:table-cell w-32">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-theme-muted uppercase tracking-tighter">Ticket Status</span>
                                                    <span className="text-sm font-bold text-theme-muted">
                                                        {p.index + 1} van {p.ticketCount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-right sm:text-center w-24">
                                                <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${p.checkedIn
                                                    ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400'
                                                    }`}>
                                                    {p.checkedIn ? 'In' : 'Nee'}
                                                </div>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-right w-24 sm:w-32">
                                                <button
                                                    onClick={() => toggleCheckIn(p)}
                                                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-90 ${p.checkedIn
                                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                                        } ${p._justToggled ? 'scale-110 ring-4 ring-white' : ''}`}
                                                >
                                                    {p.checkedIn ? 'Uit' : 'In'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {groupedParticipants.length === 0 && (
                        <div className="bg-[var(--bg-card)] border-2 border-dashed border-white/10 rounded-3xl p-16 text-center shadow-inner">
                            <div className="bg-gray-100 dark:bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-10 w-10 text-gray-300 dark:text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Geen deelnemers gevonden</h3>
                            <p className="text-theme-muted mt-2">Probeer je zoekopdracht of filters aan te passen.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
