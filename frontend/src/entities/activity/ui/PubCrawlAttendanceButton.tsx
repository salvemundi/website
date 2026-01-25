"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import qrService from '@/shared/lib/qr-service';

export default function PubCrawlAttendanceButton({ eventId }: { eventId: number }) {
    const { user } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const check = async () => {
            if (!user) return;
            try {
                const ok = await qrService.isUserAuthorizedForPubCrawlAttendance(user.id);
                setAuthorized(ok);
            } catch (err) {
                console.error('Error checking pub crawl attendance auth:', err);
            }
        };
        check();
    }, [user]);

    if (!authorized) return null;

    return (
        <button
            type="button"
            onClick={() => router.push(`/kroegentocht/${eventId}/attendance`)}
            className="inline-flex items-center gap-2 rounded-full bg-theme-purple text-white px-4 py-2 font-semibold transition-transform active:scale-95 hover:scale-[1.02] shadow-sm"
        >
            Beheer aanwezigheid
        </button>
    );
}
