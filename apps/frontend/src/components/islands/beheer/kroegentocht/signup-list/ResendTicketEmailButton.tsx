'use client';

import { useRef, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { resendPubCrawlTicketEmail } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-signup.actions';

export default function ResendTicketEmailButton({ signupId, email, paid }: {
    signupId: number;
    email?: string | null;
    paid: boolean;
}) {
    const busy = useRef(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [failed, setFailed] = useState(false);

    const send = async () => {
        if (busy.current) return;
        busy.current = true;
        setSending(true);
        setMessage('');
        try {
            const result = await resendPubCrawlTicketEmail(signupId);
            setFailed(!result.success);
            setMessage(result.success ? `Ticketmail klaargezet voor ${email}` : result.error || 'Verzenden mislukt');
        } catch {
            setFailed(true);
            setMessage('Ticketmail kon niet worden klaargezet. Probeer het later opnieuw.');
        } finally {
            busy.current = false;
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-1">
            <button
                type="button"
                disabled={sending || !paid || !email?.trim()}
                onClick={() => { void send(); }}
                title={!email?.trim() ? 'Geen e-mailadres ingevuld' : `Ticketmail opnieuw versturen naar ${email}`}
                className="beheer-button flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs text-(--theme-purple) hover:bg-(--theme-purple)/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                {sending ? 'Bezig...' : 'Ticketmail versturen'}
            </button>
            {message && <span role="status" className={`max-w-64 text-xs ${failed ? 'text-red-500' : 'text-green-600'}`}>{message}</span>}
        </div>
    );
}
