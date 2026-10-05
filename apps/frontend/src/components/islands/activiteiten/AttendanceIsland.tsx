'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getActivitySignups } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-core.actions';
import { toggleCheckInAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
import { Search, UserCheck, UserX, QrCode, Loader2, RefreshCw } from 'lucide-react';
import { safeConsoleError } from '@/server/utils/logger';

interface AttendanceSignup {
    id: number;
    participant_name: string;
    participant_email: string;
    checked_in: boolean;
    qr_token?: string;
    checked_in_at?: string | null;
}

interface AttendanceIslandProps {
    eventId: string;
    eventName: string;
    initialSignups?: AttendanceSignup[];
}

export default function AttendanceIsland({ eventId, initialSignups = [] }: AttendanceIslandProps) {
    const [signups, setSignups] = useState<AttendanceSignup[]>(initialSignups);
    const [loading, setLoading] = useState(initialSignups.length === 0);
    const [search, setSearch] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
    const scannerBootingRef = useRef(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getActivitySignups(eventId);
            const mapped = data.map(s => ({
                id: s.id || 0,
                participant_name: s.participant_name || 'Onbekend',
                participant_email: s.participant_email || 'Geen e-mail',
                checked_in: !!s.checked_in,
                qr_token: s.qr_token || undefined,
                checked_in_at: s.checked_in_at || null
            }));
            setSignups(mapped);
        } catch (error) {
            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] ', error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (initialSignups.length === 0) {
            void fetchData();
        }
    }, [fetchData, initialSignups.length]);

    const handleToggleCheckIn = useCallback(async (signupId: number, currentStatus: boolean) => {
        try {
            const result = await toggleCheckInAction(signupId, Number(eventId), !currentStatus);
            if (result.success) {
                setSignups(prev => prev.map(s =>
                    s.id === signupId ? { ...s, checked_in: !currentStatus, checked_in_at: !currentStatus ? new Date().toISOString() : null } : s
                ));
            }
        } catch (error) {
            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] ', error);
        }
    }, [eventId]);

    const handleScan = useCallback(async (qrToken: string) => {
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
    }, [signups, handleToggleCheckIn]);

    const cleanupScanner = useCallback(async () => {
        scannerBootingRef.current = false;

        const scanner = scannerRef.current;
        scannerRef.current = null;

        if (!scanner) return;

        try {
            await scanner.clear();
        } catch (error) {
            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] cleanupScanner', error);
        }
    }, []);

    useEffect(() => { return () => void cleanupScanner(); }, [cleanupScanner]);

    const handleCancelScanner = useCallback(() => {
        setScanning(false);
        void cleanupScanner();
    }, [cleanupScanner]);

    const startScanner = () => {
        if (scannerRef.current || scannerBootingRef.current) return;

        scannerBootingRef.current = true;
        setScanning(true);
        setScanResult(null);

        void (async () => {
            try {
                const { Html5QrcodeScanner } = await import('html5-qrcode');

                setTimeout(() => {
                    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                    scannerRef.current = scanner;
                    scannerBootingRef.current = false;

                    scanner.render((decodedText) => {
                        void (async () => {
                            try {
                                await cleanupScanner();
                                setScanning(false);
                                await handleScan(decodedText);
                            } catch (error) {
                                safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] 1', error);
                            }
                        })();
                    }, (errorMessage) => {
                        if (!errorMessage.includes('NotFoundException')) {
                            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] 2', errorMessage);
                        }
                    });
                }, 200);
            } catch (error) {
                scannerBootingRef.current = false;
                setScanning(false);
                safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] 3', error);
            }
        })();
    };

    const filteredSignups = signups.filter(s =>
        s.participant_name.toLowerCase().includes(search.toLowerCase()) ||
        s.participant_email.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: signups.length,
        checkedIn: signups.filter(s => s.checked_in).length
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                <div className="attendance-stat-card">
                    <p className="text-sm font-bold text-text-muted sm:text-base">Totaal inschrijvingen</p>
                    <p className="text-2xl font-black text-theme-purple sm:text-3xl">{stats.total}</p>
                </div>
                <div className="attendance-stat-card">
                    <p className="text-sm font-bold text-text-muted sm:text-base">Aanwezig</p>
                    <p className="text-2xl font-black text-theme-success sm:text-3xl">{stats.checkedIn}</p>
                </div>
                <div className="attendance-stat-card">
                    <p className="text-sm font-bold text-text-muted sm:text-base">Nog verwacht</p>
                    <p className="text-2xl font-black text-sky-600 sm:text-3xl">{stats.total - stats.checkedIn}</p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
                <div className="attendance-search-box">
                    <Search className="size-4 shrink-0 text-text-muted sm:size-5" />
                    <input
                        type="text"
                        placeholder="Zoek deelnemers..."
                        className="form-input p-0 sm:text-base"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={startScanner}
                    className="attendance-scan-btn"
                    type="button">
                    <QrCode className="size-4 sm:size-5" />
                    Scan QR
                </button>
            </div>

            {scanning && (
                <div className="fixed inset-0 isolate z-200 flex flex-col items-center justify-center bg-bg-main/80 backdrop-blur-md p-4">
                    <div id="reader" className="scanner-reader w-full max-w-md overflow-hidden squircle-lg bg-bg-card shadow-2xl" />
                    <button
                        onClick={handleCancelScanner}
                        className="mt-6 form-button squircle bg-wit-paars/20 text-base hover:bg-wit-paars/30"
                        type="button">
                        Annuleren
                    </button>
                    <style jsx global>{`
                        .scanner-reader { color: var(--text-main); }
                        .scanner-reader :is(p, span, label, small, h1, h2, h3, h4, h5, h6) { color: var(--text-main) !important; }
                        .scanner-reader :is(button, select, input) { color: var(--text-main) !important; background: var(--bg-soft) !important; border-color: var(--border-color) !important; }
                        .scanner-reader button:hover, .scanner-reader button:focus-visible { background: var(--bg-card) !important; }
                        .scanner-reader #reader__dashboard, .scanner-reader #reader__dashboard_section { color: var(--text-main) !important; }
                        .scanner-reader #reader__dashboard_section_csr, .scanner-reader #reader__dashboard_section_swaplink, .scanner-reader #reader__status_span { color: var(--text-main) !important; }
                        .scanner-reader #reader__dashboard_section_csr select, .scanner-reader #reader__dashboard_section_csr button, .scanner-reader #reader__dashboard_section_swaplink { background: var(--bg-soft) !important; color: var(--text-main) !important; border: 1px solid var(--border-color) !important; }
                        .scanner-reader #reader__scan_region { border-color: var(--border-color) !important; }
                    `}</style>
                </div>
            )}

            {scanResult && (
                <div className={`flex items-center gap-3 rounded-xl p-4 duration-300 animate-in zoom-in ${scanResult.success ? 'border border-theme-success/20 bg-theme-success/10 text-theme-success' : 'alert-error-box'}`}>
                    {scanResult.success ? <UserCheck className="size-6" /> : <UserX className="size-6" />}
                    <p className="text-base font-bold">{scanResult.message}</p>
                    <button
                        onClick={() => setScanResult(null)}
                        className="ml-auto icon-button opacity-50"
                        type="button">Sluiten</button>
                </div>
            )}

            <div className="overflow-hidden squircle-lg border border-border-color bg-bg-card shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full text-left">
                        <thead className="border-b border-border-color bg-bg-soft">
                            <tr>
                                <th className="p-4 text-sm font-black text-theme-purple/40 sm:px-6 sm:text-base">Deelnemer</th>
                                <th className="hidden p-4 text-sm font-black text-theme-purple/40 sm:px-6 sm:text-base md:table-cell">E-mail</th>
                                <th className="p-4 text-sm font-black text-theme-purple/40 sm:px-6 sm:text-base">Status</th>
                                <th className="p-4 text-right text-sm font-black whitespace-nowrap text-theme-purple/40 sm:px-6 sm:text-base">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-text-muted sm:px-6 sm:text-base">
                                        <Loader2 className="mx-auto mb-2 size-8 animate-spin" />
                                        Laden...
                                    </td>
                                </tr>
                            ) : filteredSignups.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-text-muted italic sm:px-6 sm:text-base">Geen deelnemers gevonden</td>
                                </tr>
                            ) : filteredSignups.map((s) => (
                                <tr key={s.id} className="transition-colors hover:bg-bg-soft">
                                    <td className="p-4 sm:px-6">
                                        <p className="text-sm font-bold text-theme-purple/80 sm:text-base">{s.participant_name}</p>
                                        <p className="text-xs text-text-muted sm:text-sm md:hidden">{s.participant_email}</p>
                                    </td>
                                    <td className="hidden p-4 text-sm font-medium text-text-muted sm:px-6 sm:text-base md:table-cell">
                                        {s.participant_email}
                                    </td>
                                    <td className="p-4 sm:px-6">
                                        {s.checked_in ? (
                                            <span className="badge-status-checked-in">
                                                <UserCheck className="size-3" />
                                                Aanwezig
                                            </span>
                                        ) : (
                                            <span className="badge-status-unchecked">
                                                Niet ingecheckt
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right sm:px-6">
                                        <button
                                            onClick={() => void handleToggleCheckIn(s.id, s.checked_in)}
                                            className={`form-button rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all sm:px-4 sm:text-sm ${s.checked_in ? 'text-theme-error hover:bg-theme-error/10' : 'text-theme-success hover:bg-theme-success/10'}`}
                                            type="button">
                                            {s.checked_in ? 'Afmelden' : 'Inchecken'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => void fetchData()}
                    disabled={loading}
                    className="form-button text-base text-(--theme-purple)/60 hover:text-(--theme-purple)"
                    type="button">
                    <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    Lijst vernieuwen
                </button>
            </div>
        </div>
    );
}
