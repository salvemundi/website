'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getActivitySignups, toggleCheckIn } from '@/server/actions/activities.actions';
import { Search, UserCheck, UserX, QrCode, Loader2, RefreshCw } from 'lucide-react';

interface AttendanceIslandProps {
    eventId: string;
    eventName: string;
}

export default function AttendanceIsland({ eventId, eventName }: AttendanceIslandProps) {
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const data = await getActivitySignups(eventId);
        setSignups(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const handleToggleCheckIn = async (signupId: number, currentStatus: boolean) => {
        const result = await toggleCheckIn(signupId, !currentStatus);
        if (result.success) {
            setSignups(prev => prev.map(s => 
                s.id === signupId ? { ...s, checked_in: !currentStatus, checked_in_at: !currentStatus ? new Date().toISOString() : null } : s
            ));
        }
    };

    const startScanner = () => {
        setScanning(true);
        setScanResult(null);
        
        // Wait for element to be in DOM
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            
            scanner.render(async (decodedText) => {
                await scanner.clear();
                setScanning(false);
                handleScan(decodedText);
            }, (error) => {
                // Ignore frequent scan errors
            });
        }, 100);
    };

    const handleScan = async (qrToken: string) => {
        const signup = signups.find(s => s.qr_token === qrToken);
        if (signup) {
            if (signup.checked_in) {
                setScanResult({ success: false, message: `${signup.participant_name} is al ingecheckt!` });
            } else {
                await handleToggleCheckIn(signup.id, false);
                setScanResult({ success: true, message: `${signup.participant_name} succesvol ingecheckt!` });
            }
        } else {
            setScanResult({ success: false, message: 'Ongeldige QR code / Deelnemer niet gevonden' });
        }
    };

    const filteredSignups = signups.filter(s => 
        s.participant_name.toLowerCase().includes(search.toLowerCase()) ||
        s.participant_email.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: signups.length,
        checkedIn: signups.filter(s => s.checked_in).length,
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Totaal Inschrijvingen</p>
                    <p className="text-3xl font-black text-[var(--theme-purple)]">{stats.total}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Aanwezig</p>
                    <p className="text-3xl font-black text-green-600">{stats.checkedIn}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Nog verwacht</p>
                    <p className="text-3xl font-black text-blue-600">{stats.total - stats.checkedIn}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search participants..."
                        className="w-full pl-10 pr-4 h-12 rounded-xl bg-[var(--bg-soft)] border-none focus:ring-2 focus:ring-[var(--theme-purple)]/20 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button 
                    onClick={startScanner}
                    className="h-12 px-6 rounded-xl bg-[var(--theme-purple)] text-white font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-[var(--theme-purple)]/20"
                >
                    <QrCode className="h-5 w-5" />
                    SCAN QR
                </button>
            </div>

            {scanning && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
                    <div id="reader" className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl" />
                    <button 
                        onClick={() => setScanning(false)}
                        className="mt-6 px-8 py-3 rounded-full bg-white/20 text-white font-bold hover:bg-white/30 transition-all"
                    >
                        ANNULEREN
                    </button>
                </div>
            )}

            {scanResult && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in duration-300 ${scanResult.success ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
                    {scanResult.success ? <UserCheck className="h-6 w-6" /> : <UserX className="h-6 w-6" />}
                    <p className="font-bold">{scanResult.message}</p>
                    <button onClick={() => setScanResult(null)} className="ml-auto text-xs font-black uppercase opacity-50">Sluiten</button>
                </div>
            )}

            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-[var(--bg-soft)] border-b border-[var(--border-color)]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-[var(--theme-purple)]/40 uppercase tracking-widest">Deelnemer</th>
                            <th className="px-6 py-4 text-xs font-black text-[var(--theme-purple)]/40 uppercase tracking-widest hidden md:table-cell">E-mail</th>
                            <th className="px-6 py-4 text-xs font-black text-[var(--theme-purple)]/40 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-[var(--theme-purple)]/40 uppercase tracking-widest text-right">Actie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    Laden...
                                </td>
                            </tr>
                        ) : filteredSignups.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)] italic">Geen deelnemers gevonden</td>
                            </tr>
                        ) : filteredSignups.map((s) => (
                            <tr key={s.id} className="hover:bg-[var(--bg-soft)] transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-[var(--theme-purple)]/80">{s.participant_name}</p>
                                    <p className="text-xs text-[var(--text-muted)] md:hidden">{s.participant_email}</p>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell text-sm font-medium text-[var(--text-muted)]">
                                    {s.participant_email}
                                </td>
                                <td className="px-6 py-4">
                                    {s.checked_in ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase ring-1 ring-inset ring-green-600/20">
                                            <UserCheck className="h-3 w-3" />
                                            Aanwezig
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] text-[10px] font-black uppercase ring-1 ring-inset ring-[var(--border-color)]">
                                            Niet ingecheckt
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleToggleCheckIn(s.id, s.checked_in)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${s.checked_in ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                    >
                                        {s.checked_in ? 'AFMELDEN' : 'INCHECKEN'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex justify-center">
                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="flex items-center gap-2 text-xs font-black text-[var(--theme-purple)]/60 hover:text-[var(--theme-purple)] disabled:opacity-50 transition-all"
                >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    LIJST VERNIEUWEN
                </button>
            </div>
        </div>
    );
}
