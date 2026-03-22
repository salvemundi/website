'use client';

import React from 'react';
import { Mail } from 'lucide-react';

interface ObfuscatedEmailProps {
    email: string;
    showIcon?: boolean;
    className?: string;
}

/**
 * Een component die e-mailadressen obfuscateert voor bots door ze pas te 'decoderen' als de gebruiker klikt.
 * Dit is een veiliger en CSP-vriendelijker alternatief voor Cloudflare Email Obfuscation.
 */
export function ObfuscatedEmail({ email, showIcon = true, className = "" }: ObfuscatedEmailProps) {
    if (!email || !email.includes('@')) {
        return <span className={className}>{email}</span>;
    }

    const [user, domain] = email.split('@');
    
    // We tonen het adres met [at] in de broncode en in de initiële weergave
    const displayEmail = `${user} [at] ${domain}`;

    const handleMailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Pas bij de klik bouwen we het echte mailto: adres op
        window.location.href = `mailto:${user}@${domain}`;
    };

    return (
        <a 
            href={`#email-decode-${user}`}
            onClick={handleMailClick}
            className={`inline-flex items-center gap-2 hover:text-[var(--color-purple-500)] transition-colors cursor-pointer ${className}`}
            title="Klik om te e-mailen"
        >
            {showIcon && <Mail className="h-4 w-4 shrink-0 opacity-70" />}
            <span className="font-semibold">{displayEmail}</span>
        </a>
    );
}
