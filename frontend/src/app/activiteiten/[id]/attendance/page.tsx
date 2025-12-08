"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import qrService from '@/shared/lib/qr-service';
import exportEventSignups from '@/shared/lib/exportSignups';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

export default function AttendancePage() {
    const params = useParams();
    const eventId = Number(params?.id);
    const { user } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await qrService.getEventSignupsWithCheckIn(eventId);
            setSignups(list);
        } catch (err) {
            console.error(err);
            setMessage('Kon inschrijvingen niet laden');
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

    const toggleCheckIn = async (row: any) => {
        try {
            const target = !row.checked_in;
            await fetch(`/api/directus/items/event_signups/${row.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checked_in: target, checked_in_at: target ? new Date().toISOString() : null })
            });
            setMessage(`${row.participant_name || 'Deelnemer'} is nu ${target ? 'ingecheckt' : 'uitgecheckt'}`);
            await load();
        } catch (err) {
            console.error(err);
            setMessage('Kon status niet bijwerken');
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleScan = async (token: string) => {
        // Use qrService.checkInParticipant
        const res = await qrService.checkInParticipant(token);
        if (res.success) {
            setMessage('Succesvol ingecheckt');
            await load();
        } else {
            setMessage(res.message || 'Fout bij inchecken');
        }
        setTimeout(() => setMessage(null), 3000);
    };

    if (!user) {
        return <div className="p-8">Je moet ingelogd zijn om deze pagina te zien.</div>;
    }

    if (!authorized) {
        return <div className="p-8">Je bent niet gemachtigd om aanwezigheden te beheren voor dit evenement.</div>;
    }

    return (
        <div>
            <PageHeader title="Aanwezigheid beheren" backgroundImage="/img/backgrounds/Kroto2025.jpg" />
            <main className="mx-auto max-w-app px-4 py-8">
                <div className="mb-4 flex gap-3">
                    <button onClick={load} className="btn">Ververs</button>
                    <button onClick={() => exportEventSignups(signups, `aanmeldingen-${eventId}.xlsx`)} className="btn">Exporteren</button>
                </div>

                {message && <div className="mb-4 p-3 bg-green-100 rounded">{message}</div>}

                <div className="mb-6">
                    <label className="block mb-2 font-semibold">Scan QR token (plak token of scan met extern device)</label>
                    <div className="flex gap-2">
                        <input id="qr-token-input" className="flex-1 px-3 py-2 rounded" placeholder="Plak QR token hier" />
                        <button onClick={async () => {
                            const el = document.getElementById('qr-token-input') as HTMLInputElement | null;
                            if (!el || !el.value) return;
                            await handleScan(el.value.trim());
                            el.value = '';
                        }} className="btn">Check-in</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Email</th>
                                <th>Telefoon</th>
                                <th>Ingecheckt</th>
                                <th>Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5}>Laden...</td></tr>
                            ) : signups.length === 0 ? (
                                <tr><td colSpan={5}>Geen inschrijvingen gevonden</td></tr>
                            ) : signups.map(s => (
                                <tr key={s.id}>
                                    <td>{s.participant_name || (s.directus_relations?.first_name ? `${s.directus_relations.first_name} ${s.directus_relations.last_name || ''}` : '—')}</td>
                                    <td>{s.participant_email || s.directus_relations?.email || '—'}</td>
                                    <td>{s.participant_phone || s.directus_relations?.phone_number || '—'}</td>
                                    <td>{s.checked_in ? 'Ja' : 'Nee'}</td>
                                    <td>
                                        <button onClick={() => toggleCheckIn(s)} className="btn">Toggle</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
