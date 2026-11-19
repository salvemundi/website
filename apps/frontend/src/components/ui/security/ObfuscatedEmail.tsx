'use client';

import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { Anchor, Group, Text, VisuallyHidden, type MantineSize } from '@mantine/core';

interface ObfuscatedEmailProps {
    email: string;
    showIcon?: boolean;
    footerLink?: boolean;
    size?: MantineSize;
    fullWidth?: boolean;
}

/**
 * Een component die e-mailadressen obfuscateert voor bots.
 * Bezoekers zien een normaal e-mailadres, maar bots scrapen verborgen valstrik-tekst.
 * De mailto: link wordt pas na hydratie of bij een klik opgebouwd.
 */
export function ObfuscatedEmail({
    email,
    showIcon = true,
    footerLink = false,
    size = 'sm',
    fullWidth = false,
}: ObfuscatedEmailProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!email || !email.includes('@')) {
        return <Text component="span" size={size}>{email}</Text>;
    }

    const [user, domain] = email.split('@');

    const handleMailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = `mailto:${user}@${domain}`;
    };

    return (
        <Anchor
            href={isMounted ? `mailto:${user}@${domain}` : undefined}
            onClick={handleMailClick}
            size={size}
            fw={footerLink ? undefined : 600}
            c={footerLink ? 'dimmed' : 'inherit'}
            underline="never"
            w={fullWidth ? '100%' : undefined}
            mod={footerLink ? { 'footer-link': true } : undefined}
            title="Klik om te e-mailen"
        >
            <Group
                component="span"
                gap={8}
                wrap="nowrap"
                style={{
                    minWidth: 0,
                    display: 'inline-flex',
                    width: fullWidth ? '100%' : undefined,
                }}
            >
                {showIcon && (
                    <Text component="span" lh={1} c="dimmed" style={{ flexShrink: 0 }}>
                        <Mail size={16} />
                    </Text>
                )}

                <Text
                    component="span"
                    inherit
                    truncate={fullWidth ? true : undefined}
                    style={{ overflowWrap: 'anywhere' }}
                >
                    {user}
                    <VisuallyHidden aria-hidden="true"> [anti-spam] </VisuallyHidden>
                    @
                    <VisuallyHidden aria-hidden="true"> [verwijder-dit] </VisuallyHidden>
                    {domain}
                </Text>
            </Group>
        </Anchor>
    );
}
