'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPubCrawlScannerEnabled, setPubCrawlScannerEnabled } from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';

export default function KroegentochtScannerSettings({ eventId }: { eventId: number }) {
    const [enabled, setEnabled] = useState(false);
    const [pending, setPending] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let cancelled = false;
        void getPubCrawlScannerEnabled(eventId).then(value => { if (!cancelled) setEnabled(value); }).catch(() => { if (!cancelled) setError('Scannerinstellingen konden niet worden geladen.'); }).finally(() => { if (!cancelled) setPending(false); });
        return () => { cancelled = true; };
    }, [eventId]);
    const href = `/kroegentocht-scanner/${eventId}`;
    return <section className="space-y-3 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) p-5">
        <h2 className="text-lg font-semibold">Publieke ticketscanner</h2>
        <p>Groepsleiders kunnen zonder account scannen. Activeer de scanner tijdens de kroegentocht en deactiveer hem na afloop.</p>
        <button type="button" role="switch" aria-checked={enabled} disabled={pending || !!error} className="beheer-button rounded bg-purple-700 px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={() => {
            setPending(true);
            void setPubCrawlScannerEnabled(eventId, !enabled).then(setEnabled).catch(() => setError('Bijwerken van de scanner mislukt. Vernieuw de pagina en probeer opnieuw.')).finally(() => setPending(false));
        }}>{pending ? 'Laden…' : enabled ? 'Scanner actief — deactiveren' : 'Scanner inactief — activeren'}</button>
        <div><Link href={href} target="_blank" className="underline">Scanner openen</Link></div>
        <button type="button" className="beheer-button underline" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}${href}`).catch(() => setError('Kopiëren mislukt. Kopieer de link via Scanner openen.')); }}>Link voor groepsleiders kopiëren</button>
        {error && <p role="alert">{error}</p>}
    </section>;
}
