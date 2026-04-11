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
            href={isMounted ? `mailto:${user}@${domain}` : `#`}
            onClick={handleMailClick}
            className={`inline-flex items-center gap-2 hover:text-[var(--color-purple-500)] transition-colors cursor-pointer ${className}`}
            title="Klik om te e-mailen"
        >
            {showIcon && <Mail className="h-4 w-4 shrink-0 opacity-70" />}

            {/* Visueel ziet dit eruit als "user@domain.nl". 
              Bots die de pure HTML scrapen zien: "user[spam-trap]@[verwijder-dit]domain.nl"
            */}
            <span className="font-semibold inline-flex items-center">
                <span>{user}</span>
                <span className="hidden"> [anti-spam] </span>
                <span>@</span>
                <span className="hidden"> [verwijder-dit] </span>
                <span>{domain}</span>
            </span>
        </a>
    );
}
