'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FlipHorizontal2, ScanLine, Square, TriangleAlert } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';
import { scanPubCrawlTicket } from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';
import styles from './KroegentochtScannerIsland.module.css';

type Result = Awaited<ReturnType<typeof scanPubCrawlTicket>>;

function cameraError(error: unknown): string {
    const name = error instanceof Error ? error.name : String(error);
    if (/NotAllowed|Permission|permission/i.test(name)) return 'Geef je browser toegang tot de camera en probeer opnieuw.';
    if (/NotFound|DevicesNotFound/i.test(name)) return 'Geen camera gevonden. Probeer een ander apparaat.';
    if (/NotReadable|TrackStart/i.test(name)) return 'De camera is al in gebruik. Sluit andere camera-apps en probeer opnieuw.';
    return 'De camera kon niet starten. Controleer de cameratoestemming of probeer de andere camera.';
}

export default function KroegentochtScannerIsland({ eventId, eventName, groups }: { eventId: number; eventName: string; groups: string[] }) {
    const [group, setGroup] = useState('');
    const [running, setRunning] = useState(false);
    const [ready, setReady] = useState(false);
    const [facing, setFacing] = useState<'environment' | 'user'>('environment');
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState('');
    const cameraQueue = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        const bodyStyle = document.body.style.cssText;
        const overflow = document.documentElement.style.overflow;
        const scrollY = window.scrollY;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        const onVisibilityChange = () => {
            if (document.hidden) { setRunning(false); setReady(false); setResult(null); }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            document.body.style.cssText = bodyStyle;
            document.documentElement.style.overflow = overflow;
            window.scrollTo(0, scrollY);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!running) return;
        let disposed = false;
        const isDisposed = () => disposed;
        let scanner: Html5Qrcode | undefined;
        let busy = false;
        let lastToken = '';
        let lastSeen = 0;
        const boot = cameraQueue.current.then(async () => {
            if (isDisposed()) return;
            if (!window.isSecureContext || typeof navigator.mediaDevices === 'undefined' || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                throw new Error('Gebruik een beveiligde HTTPS-verbinding om de camera te openen.');
            }
            const { Html5Qrcode: Scanner, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
            if (isDisposed()) return;
            scanner = new Scanner('pub-crawl-reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
            await scanner.start({ facingMode: facing }, {
                fps: 10,
                aspectRatio: 1,
                qrbox: (width, height) => {
                    const size = Math.floor(Math.min(width, height) * 0.7);
                    return { width: size, height: size };
                }
            }, token => {
                const now = Date.now();
                if (isDisposed()) return;
                if (token === lastToken && now - lastSeen < 3000) { lastSeen = now; return; }
                if (busy) return;
                lastToken = token;
                lastSeen = now;
                busy = true;
                void scanPubCrawlTicket(eventId, group, token).then(response => {
                    if (isDisposed()) return;
                    setResult(response);
                    if (response.status === 'inactive') { setRunning(false); setReady(false); }
                }).catch(() => {
                    if (!isDisposed()) setResult({ status: 'error', message: 'Scannen mislukt. Controleer je verbinding en probeer de code opnieuw.' });
                }).finally(() => {
                    if (isDisposed()) return;
                    busy = false;
                });
            }, () => {});
            if (!isDisposed()) setReady(true);
        });
        const handledBoot = boot.catch((reason: unknown) => {
            if (isDisposed()) return;
            setError(!window.isSecureContext ? 'Open deze pagina via HTTPS om de camera te gebruiken.' : cameraError(reason));
            setRunning(false);
            setReady(false);
        });
        cameraQueue.current = handledBoot;
        return () => {
            disposed = true;
            // Wait for pending permission/start requests before releasing the camera.
            // A replacement camera starts only after this cleanup has finished.
            cameraQueue.current = handledBoot.then(async () => {
                if (!scanner) return;
                if (scanner.isScanning) await scanner.stop();
                scanner.clear();
            }).catch(() => {});
        };
    }, [running, eventId, group, facing]);

    const stop = () => { setRunning(false); setReady(false); setResult(null); };
    const switchCamera = () => {
        setReady(false);
        setError('');
        setResult(null);
        setFacing(value => value === 'environment' ? 'user' : 'environment');
        setRunning(true);
    };
    const successful = result?.status === 'success';
    const warning = result?.status === 'duplicate' || result?.status === 'wrong-group';

    return <section className={styles.screen} aria-label="Kroegentocht ticketscanner">
        <header className="shrink-0 space-y-3 px-5 pt-3 pb-4">
            <div className="flex items-center gap-3">
                <ScanLine className="size-7 shrink-0 text-purple-300" aria-hidden="true" />
                <div className="min-w-0">
                    <h1 className="text-lg font-bold">Tickets scannen</h1>
                    <p className="truncate text-sm text-gray-300">{eventName}</p>
                </div>
            </div>
            <label className="block text-sm font-medium" htmlFor="scanner-group">Jouw groep</label>
            <select id="scanner-group" value={group} disabled={running} onChange={event => setGroup(event.target.value)} className="min-h-12 form-input w-full rounded-xl border border-white/20 bg-gray-900 px-4 text-base text-white disabled:opacity-80">
                <option value="">Kies je groep</option>
                {groups.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        </header>

        <div className={styles.camera}>
            <div id="pub-crawl-reader" className={`${styles.reader} ${ready ? '' : 'invisible'}`} />
            {!ready && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <Camera className="size-12 text-purple-300" aria-hidden="true" />
                <p className="max-w-sm text-base text-gray-200">{error || (running ? 'Camera openen…' : !groups.length ? 'Er zijn nog geen groepen ingesteld. Vraag de organisatie om groepen toe te voegen.' : !group ? 'Kies hierboven je groep om te beginnen.' : 'Klaar om te scannen. De achtercamera opent automatisch.')}</p>
                {error && <button type="button" className="form-button min-h-12 rounded-xl border border-white/30 px-5 text-white" onClick={switchCamera}>Andere camera proberen</button>}
            </div>}

        </div>

        <footer className="shrink-0 space-y-3 px-5 py-4">
            <div className={`${styles.status} ${result ? successful ? 'border-green-500 bg-green-950' : warning ? 'border-amber-500 bg-amber-950' : 'border-red-500 bg-red-950' : 'border-white/15 bg-gray-900'}`} role="status" aria-live="polite" aria-atomic="true">
                {result ? <>
                    {successful ? <CheckCircle2 className="size-7 shrink-0 text-green-400" aria-hidden="true" /> : <TriangleAlert className={`size-7 shrink-0 ${warning ? 'text-amber-400' : 'text-red-400'}`} aria-hidden="true" />}
                    <div className="min-w-0">
                        <h2 className="font-bold">{successful ? 'Welkom!' : result.status === 'wrong-group' ? 'Andere groep' : result.status === 'duplicate' ? 'Al ingecheckt' : 'Niet toegelaten'}</h2>
                        <p className="line-clamp-3 text-sm wrap-break-word">{result.message}</p>
                    </div>
                </> : <p className="text-sm text-gray-300">{ready ? 'Houd een QR-code in het kader. De uitslag verschijnt hier; je kunt direct verder scannen.' : running ? 'Geef toestemming om je camera te gebruiken.' : 'Alleen tickets van jouw groep worden ingecheckt.'}</p>}
            </div>
            <div className="flex gap-3">
                <button type="button" disabled={!group} onClick={() => {
                    if (running) { stop(); return; }
                    setError(''); setResult(null); setReady(false); setRunning(true);
                }} className="form-button flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 font-semibold text-white disabled:opacity-50">
                    {running ? <Square className="size-5" aria-hidden="true" /> : <Camera className="size-5" aria-hidden="true" />}
                    {running ? 'Stoppen / groep wijzigen' : error ? 'Opnieuw proberen' : 'Camera starten'}
                </button>
                {running && <button type="button" disabled={!ready} onClick={switchCamera} className="icon-button flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/30 text-white disabled:opacity-50" aria-label="Wissel tussen voor- en achtercamera" title="Camera wisselen"><FlipHorizontal2 className="size-6" aria-hidden="true" /></button>}
            </div>
        </footer>
    </section>;
}
