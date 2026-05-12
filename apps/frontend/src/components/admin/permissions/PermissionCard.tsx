'use client';

import React from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Permission {
    id: string | number;
    name: string;
    slug: string;
    description?: string | null;
}

interface PermissionCardProps {
    permission: Permission;
    isActive?: boolean;
    onToggle?: (id: string | number) => void;
    isCritical?: boolean;
}

export default function PermissionCard({
    permission,
    isActive = false,
    onToggle = () => { },
    isCritical = false
}: PermissionCardProps) {
    const Icon = isCritical ? ShieldAlert : (isActive ? ShieldCheck : Shield);

    return (
        <div
            onClick={() => onToggle(permission.id)}
            className={`group relative flex flex-col p-6 rounded-[var(--beheer-radius)] border transition-all cursor-pointer ${isActive
                    ? 'bg-[var(--beheer-accent)]/5 border-[var(--beheer-accent)] shadow-md'
                    : 'bg-[var(--beheer-card-bg)] border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/50'
                }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl transition-colors ${isActive
                        ? 'bg-[var(--beheer-accent)] text-white'
                        : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)]'
                    }`}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className={`h-6 w-11 rounded-full transition-colors relative ${isActive ? 'bg-[var(--beheer-accent)]' : 'bg-[var(--beheer-border)]'
                    }`}>
                    <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                </div>
            </div>

            <div className="space-y-2">
                <h3 className={`text-base font-bold transition-colors ${isActive ? 'text-[var(--beheer-text)]' : 'text-[var(--beheer-text-muted)]'
                    }`}>
                    {permission.name}
                </h3>

                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] text-sm font-medium text-[var(--beheer-text-muted)]">
                        {permission.slug}
                    </span>
                </div>

                {permission.description && (
                    <p className="text-base text-[var(--beheer-text-muted)]/70 leading-relaxed mt-2 line-clamp-2">
                        {permission.description}
                    </p>
                )}
            </div>

            {isCritical && isActive && (
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-red-500 animate-pulse">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Hoge impact permissie</span>
                </div>
            )}
        </div>
    );
}