'use client';

import React from 'react';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface GuestTabProps {
    name: string;
    email: string;
    phone: string;
    onNameChange: (val: string) => void;
    onEmailChange: (val: string) => void;
    onPhoneChange: (val: string) => void;
}

export default function GuestTab({
    name,
    email,
    phone,
    onNameChange,
    onEmailChange,
    onPhoneChange
}: GuestTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div className="group">
                    <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2.5 ml-1 group-focus-within:text-[var(--beheer-accent)] transition-colors">Naam Gast *</label>
                    <input
                        suppressHydrationWarning
                        type="text"
                        required
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="beheer-input h-14 text-[10px] font-semibold  tracking-[0.2em]"
                        placeholder="VOLLEDIGE NAAM"
                        autoComplete="off"
                    />
                </div>
                <div className="group">
                    <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2.5 ml-1 group-focus-within:text-[var(--beheer-accent)] transition-colors">E-mailadres *</label>
                    <input
                        suppressHydrationWarning
                        type="email"
                        required
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        className="beheer-input h-14 text-[10px] font-semibold  tracking-[0.2em]"
                        placeholder="EMAIL@VOORBEELD.NL"
                        autoComplete="off"
                    />
                </div>
                <div className="group">
                    <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2.5 ml-1 group-focus-within:text-[var(--beheer-accent)] transition-colors">Telefoonnummer</label>
                    <PhoneInput
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        className="beheer-input h-14 text-[10px] font-semibold tracking-[0.2em]"
                        placeholder="OPTIONEEL"
                    />
                </div>
            </div>
        </div>
    );
}
