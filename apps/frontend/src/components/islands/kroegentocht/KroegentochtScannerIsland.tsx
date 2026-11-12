'use client';

import { useEffect, useState } from 'react';
import type { Html5QrcodeScanner } from 'html5-qrcode';
import { scanPubCrawlTicket } from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';

type Result = Awaited<ReturnType<typeof scanPubCrawlTicket>>;

export default function KroegentochtScannerIsland({ eventId, eventName, groups }: { eventId: number; eventName: string; groups: string[] }) {
    const [group, setGroup] = useState('');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!running) return;
        let disposed = false;
        let scanner: Html5QrcodeScanner | undefined;
        let busy = false;
        let lastToken = '';
        let lastSeen = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        void import('html5-qrcode').then(({ Html5QrcodeScanner: Scanner }) => {
            if (disposed) return;
            scanner = new Scanner('pub-crawl-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render((token) => {
                const now = Date.now();
                if (disposed) return;
                if (token === lastToken && now - lastSeen < 3000) {
                    lastSeen = now;
                    return;
                }
                if (busy) return;
                lastToken = token;
                lastSeen = now;
                busy = true;
                void scanPubCrawlTicket(eventId, group, token).then(response => {
                    if (disposed) return;
                    setResult(response);
                    if (response.status === 'inactive') setRunning(false);
                }).catch(() => {
                    if (!disposed) setResult({ status: 'error', message: 'Scannen mislukt. Probeer de code opnieuw.' });
                }).finally(() => {
                    if (disposed) return;
                    timer = setTimeout(() => { setResult(null); busy = false; }, 2200);
                });
            }, () => {});
        }).catch(() => { if (!disposed) { setError('Camera kon niet starten. Controleer je cameratoestemming en probeer opnieuw.'); setRunning(false); } });
        return () => {
            disposed = true;
            if (timer) clearTimeout(timer);
            if (scanner) void scanner.clear().catch(() => {});
        };
    }, [running, eventId, group]);

    return <div className="space-y-5">
        <h2 className="text-xl font-semibold">{eventName}</h2>
        <label className="block">Jouw groep
            <select value={group} disabled={running} onChange={event => setGroup(event.target.value)} className="mt-2 block form-input w-full rounded border bg-(--bg-card) p-3">
                <option value="">Kies je groep</option>
                {groups.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        </label>
        {!groups.length && <p>Er zijn nog geen groepen ingesteld. Vraag de organisatie om groepen toe te voegen.</p>}
        <p>Scan de QR-code op het ticket. De status verschijnt automatisch; daarna kun je direct de volgende code scannen.</p>
        <button type="button" disabled={!group} onClick={() => { setError(''); setResult(null); setRunning(!running); }} className="form-button rounded bg-purple-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{running ? 'Scanner stoppen' : 'Scanner starten'}</button>
        {error && <p role="alert">{error}</p>}
        <div id="pub-crawl-reader" />
        {result && <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" role="status" aria-live="polite">
            <div className={`w-full max-w-md rounded-2xl border-4 bg-white p-8 text-center text-gray-900 shadow-xl ${result.status === 'success' ? 'border-green-600' : result.status === 'duplicate' || result.status === 'wrong-group' ? 'border-amber-500' : 'border-red-600'}`}>
                <h3 className="mb-3 text-2xl font-bold">{result.status === 'success' ? 'Welkom!' : result.status === 'wrong-group' ? 'Andere groep' : result.status === 'duplicate' ? 'Al ingecheckt' : 'Niet toegelaten'}</h3>
                <p className="text-lg">{result.message}</p>
            </div>
        </div>}
    </div>;
}
