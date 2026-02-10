"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import qrService from '@/shared/lib/qr-service';

export default function AttendanceButton({ eventId, userId }: { eventId: number; userId: string }) {
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const check = async () => {
            try {
                const ok = await qrService.isUserAuthorizedForAttendance(userId, eventId);
                setAuthorized(ok);
            } catch (err) {
                console.error(err);
            }
        };
        check();
    }, [eventId, userId]);

    if (!authorized) return null;

    return (
        <button type="button" onClick={() => router.push(`/activiteiten/${eventId}/attendance`)} className="inline-flex items-center gap-2 rounded-full bg-theme-purple text-white px-4 py-2 font-semibold transition-transform active:scale-95 hover:scale-[1.02] shadow-sm">
            Beheer aanwezigheid
        </button>
    );
}
