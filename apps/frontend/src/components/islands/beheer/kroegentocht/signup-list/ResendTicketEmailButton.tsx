'use client';

import { useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button, Stack, Text } from '@mantine/core';
import { resendPubCrawlTicketEmail } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-signup.actions';

export default function ResendTicketEmailButton({
    signupId,
    email,
    paid,
}: {
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
            setMessage(
                result.success
                    ? `Ticketmail klaargezet voor ${email}`
                    : result.error || 'Verzenden mislukt'
            );
        } catch {
            setFailed(true);
            setMessage('Ticketmail kon niet worden klaargezet. Probeer het later opnieuw.');
        } finally {
            busy.current = false;
            setSending(false);
        }
    };

    return (
        <Stack gap={4} align="flex-start">
            <Button
                type="button"
                size="xs"
                loading={sending}
                disabled={sending || !paid || !email?.trim()}
                onClick={() => {
                    void send();
                }}
                title={
                    !email?.trim()
                        ? 'Geen e-mailadres ingevuld'
                        : `Ticketmail opnieuw versturen naar ${email}`
                }
                leftSection={<Mail size={14} />}
            >
                {sending ? 'Bezig...' : 'Ticketmail versturen'}
            </Button>
            {message && (
                <Text role="status" size="xs" maw={256} c={failed ? 'error' : 'success'}>
                    {message}
                </Text>
            )}
        </Stack>
    );
}
