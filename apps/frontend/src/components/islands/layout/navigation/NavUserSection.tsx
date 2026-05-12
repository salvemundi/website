'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { User, Shield } from 'lucide-react';
import { authClient } from '@/lib/auth';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ROUTES } from '@/lib/config/routes';

import { type ExtendedSession } from '@/types/auth';

interface NavUserSectionProps {
    initialSession: ExtendedSession | null | undefined;
    canAccessAdmin: boolean;
}

export function NavUserSection({ initialSession, canAccessAdmin }: NavUserSectionProps) {
    const searchParams = useSearchParams();

    // NUCLEAR SSR: We trust the server-side session as the single source of truth.
    // This eliminates "stuttering" or flickering to guest state during hydration.
    // If the user logs in or out, the subsequent redirect/refresh will update the server state.
    const session = initialSession;
    const user = session?.user ?? null;
    const isAuthenticated = !!user;

    const showAdmin = isAuthenticated && canAccessAdmin;

    return (
        <div className="flex items-center justify-end gap-1.5 lg:gap-2 shrink-0 flex-nowrap">
            {showAdmin && (
                <Link
                    href={ROUTES.ADMIN}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-[var(--color-white)] px-3 py-1.5 h-9 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg shrink-0"
                >
                    <Shield className="h-4 w-4 shrink-0" />
                    <span className="hidden @[1200px]:inline">Admin</span>
                </Link>
            )}

            {isAuthenticated ? (
                <Link
                    href={ROUTES.ACCOUNT}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 h-9 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg shrink-0"
                >
                    <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0 bg-[var(--color-purple-50)] dark:bg-white/10 flex items-center justify-center">
                        {user.avatar ? (
                            <Image src={getImageUrl(user.avatar)} alt={user.name || 'Profiel'} fill className="object-cover" priority unoptimized />
                        ) : (
                            <User className="h-3.5 w-3.5 text-[var(--color-purple-600)]" />
                        )}
                    </div>
                    <span className="hidden @[1200px]:inline">Mijn profiel</span>
                </Link>
            ) : (
                <button
                    onClick={() => authClient.signIn.social({
                        provider: 'microsoft',
                        // Jouw toevoeging blijft intact
                        callbackURL: searchParams.get('callbackURL') || ROUTES.MEMBERSHIP
                    })}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold px-4 py-1.5 h-9 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg bg-[var(--color-purple-50)] text-[var(--color-purple-700)] shrink-0"
                >
                    Inloggen
                </button>
            )}
        </div>
    );
}