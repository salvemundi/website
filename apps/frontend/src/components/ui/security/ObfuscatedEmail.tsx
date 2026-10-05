'use client';

import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

interface ObfuscatedEmailProps {
    email: string;
    showIcon?: boolean;
    className?: string;
}

/**
 * Een component die e-mailadressen obfuscateert voor bots.
 * Bezoekers zien een normaal e-mailadres, maar bots scrapen verborgen valstrik-tekst.
 * De mailto: link wordt pas na hydratie of bij een klik opgebouwd.
 */
export function ObfuscatedEmail({ email, showIcon = true, className = "" }: ObfuscatedEmailProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!email || !email.includes('@')) {
        return <span className={className}>{email}</span>;
    }

    const [user, domain] = email.split('@');

    const handleMailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = `mailto:${user}@${domain}`;
    };

    return (
        <a
            href={isMounted ? `mailto:${user}@${domain}` : undefined}
            onClick={handleMailClick}
            className={`inline cursor-pointer transition-colors hover:text-purple-500 ${className}`}
            title="Klik om te e-mailen"
        >
            {showIcon && <Mail className="mr-2 inline size-4 shrink-0 opacity-70" />}

            <span className="inline font-semibold wrap-anywhere">
                <span>{user}</span>
                <span className="hidden" aria-hidden="true"> [anti-spam] </span>
                <span>@</span>
                <span className="hidden" aria-hidden="true"> [verwijder-dit] </span>
                <span>{domain}</span>
            </span>
        </a>
    );
}
