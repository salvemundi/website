"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import qrService from '@/shared/lib/qr-service';
import exportEventSignups from '@/shared/lib/exportSignups';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Search, Camera, Download, RefreshCw, X, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendancePage() {
    const params = useParams();
    const eventId = Number(params?.id);
    const { user } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const scannerRef = useRef<any>(null);
    const videoRef = useRef<HTMLDivElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await qrService.getEventSignupsWithCheckIn(eventId);
            setSignups(list);
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
            const ok = await qrService.isUserAuthorizedForAttendance(user.id, eventId);
            setAuthorized(ok);
            if (ok) await load();
        };
        check();
    }, [user, eventId]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const toggleCheckIn = async (row: any) => {
        try {
            const target = !row.checked_in;
            await fetch(`/api/directus/items/event_signups/${row.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checked_in: target, checked_in_at: target ? new Date().toISOString() : null })
            });
            showMessage(`${row.participant_name || 'Deelnemer'} is nu ${target ? 'ingecheckt' : 'uitgecheckt'}`, 'success');
            await load();
        } catch (err) {
            console.error(err);
            showMessage('Kon status niet bijwerken', 'error');
        }
    };

    const handleScan = async (token: string) => {
        if (!token.trim()) return;
        const res = await qrService.checkInParticipant(token);
        if (res.success) {
            showMessage('Succesvol ingecheckt!', 'success');
            await load();
        } else {
            showMessage(res.message || 'Fout bij inchecken', 'error');
        }
    };

    const startScanner = async () => {
        try {
            setScannerError(null);
            setShowScanner(true);
            
            // Dynamically import html5-qrcode
            const { Html5Qrcode } = await import('html5-qrcode');
            
            if (videoRef.current && !scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-reader');
                
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    async (decodedText: string) => {
                        await handleScan(decodedText);
                        stopScanner();
                    },
                    (_errorMessage: string) => {
                        // Ignore decode errors (normal when no QR in view)
                    }
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

    // Filter signups based on search
    const filteredSignups = signups.filter(s => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const name = s.participant_name || (s.directus_relations?.first_name ? `${s.directus_relations.first_name} ${s.directus_relations.last_name || ''}` : '');
        const email = s.participant_email || s.directus_relations?.email || '';
        const phone = s.participant_phone || s.directus_relations?.phone_number || '';
        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query) || phone.includes(query);
    });

    const stats = {
        total: signups.length,
        checkedIn: signups.filter(s => s.checked_in).length,
        notCheckedIn: signups.filter(s => !s.checked_in).length
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-4">
                    <h2 className="text-2xl font-bold text-theme-purple mb-4">Inloggen vereist</h2>
                    <p className="text-gray-600">Je moet ingelogd zijn om deze pagina te zien.</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-4">
                    <h2 className="text-2xl font-bold text-theme-purple mb-4">Geen toegang</h2>
                    <p className="text-gray-600">Je bent niet gemachtigd om aanwezigheden te beheren voor dit evenement.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige">
            <PageHeader title="Aanwezigheid beheren" backgroundImage="/img/backgrounds/Kroto2025.jpg" />
            
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Message Toast */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
                        message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        <span className="font-semibold">{message.text}</span>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end rounded-3xl p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-paars/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-theme-purple-dark" />
                            </div>
                            <div>
                                <p className="text-sm text-theme-purple-dark font-semibold">Totaal inschrijvingen</p>
                                <p className="text-3xl font-bold text-theme-purple">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-white/90 font-semibold">Ingecheckt</p>
                                <p className="text-3xl font-bold text-white">{stats.checkedIn}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-white/90 font-semibold">Niet ingecheckt</p>
                                <p className="text-3xl font-bold text-white">{stats.notCheckedIn}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={load}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-white text-theme-purple font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        Ververs
                    </button>
                    
                    <button
                        onClick={() => exportEventSignups(signups, `aanmeldingen-${eventId}.csv`)}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-white text-theme-purple font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        <Download className="h-5 w-5" />
                        Exporteer CSV
                    </button>
                    
                    <button
                        onClick={showScanner ? stopScanner : startScanner}
                        className={`inline-flex items-center gap-2 px-4 py-3 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 ${
                            showScanner ? 'bg-red-500 text-white' : 'bg-theme-purple text-white'
                        }`}
                    >
                        {showScanner ? <X className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                        {showScanner ? 'Sluit Scanner' : 'Open Camera'}
                    </button>
                </div>

                {/* Scanner Error */}
                {scannerError && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl">
                        <p className="font-semibold">Camera fout:</p>
                        <p>{scannerError}</p>
                    </div>
                )}

                {/* QR Scanner */}
                {showScanner && (
                    <div className="mb-6 bg-white rounded-3xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-theme-purple mb-4">Scan QR Code</h3>
                        <div id="qr-reader" ref={videoRef} className="rounded-xl overflow-hidden"></div>
                    </div>
                )}

                {/* Manual Token Input */}
                <div className="mb-6 bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end rounded-3xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-theme-purple mb-4">Handmatige invoer</h3>
                    <div className="flex gap-2">
                        <input
                            id="qr-token-input"
                            className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-paars"
                            placeholder="Plak QR token hier..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const el = e.target as HTMLInputElement;
                                    handleScan(el.value.trim());
                                    el.value = '';
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                const el = document.getElementById('qr-token-input') as HTMLInputElement | null;
                                if (el?.value) {
                                    handleScan(el.value.trim());
                                    el.value = '';
                                }
                            }}
                            className="px-6 py-3 bg-theme-purple text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
                        >
                            Check-in
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6 bg-white rounded-3xl p-6 shadow-lg">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Zoek op naam, email of telefoonnummer..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-paars"
                        />
                    </div>
                    {searchQuery && (
                        <p className="mt-2 text-sm text-slate-600">
                            {filteredSignups.length} van {signups.length} resultaten
                        </p>
                    )}
                </div>

                {/* Signups Table */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-theme-purple to-paars text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Naam</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Telefoon</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Status</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            Laden...
                                        </td>
                                    </tr>
                                ) : filteredSignups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            {searchQuery ? 'Geen resultaten gevonden' : 'Geen inschrijvingen gevonden'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSignups.map((s, idx) => (
                                        <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="px-6 py-4 text-slate-900 font-medium">
                                                {s.participant_name || (s.directus_relations?.first_name ? `${s.directus_relations.first_name} ${s.directus_relations.last_name || ''}` : '—')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {s.participant_email || s.directus_relations?.email || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {s.participant_phone || s.directus_relations?.phone_number || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {s.checked_in ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Ingecheckt
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                                                        <Clock className="h-4 w-4" />
                                                        Niet ingecheckt
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleCheckIn(s)}
                                                    className={`px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 ${
                                                        s.checked_in
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : 'bg-green-500 text-white hover:bg-green-600'
                                                    }`}
                                                >
                                                    {s.checked_in ? 'Uitchecken' : 'Inchecken'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
