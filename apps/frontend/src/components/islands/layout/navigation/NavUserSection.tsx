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
        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 lg:gap-2">
            {showAdmin && (
                <Link
                    href={ROUTES.ADMIN}
                    className="squircle flex h-9 shrink-0 items-center gap-2 bg-purple-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <Shield className="size-4 shrink-0" />
                    <span className="hidden @[1200px]:inline">Beheer</span>
                </Link>
            )}

            {isAuthenticated ? (
                <Link
                    href={ROUTES.ACCOUNT}
                    className="squircle flex h-9 shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium text-(--text-main) shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-50 dark:bg-white/10">
                        {user.avatar ? (
                            <Image src={getImageUrl(user.avatar)} alt={user.name || 'Profiel'} fill className="object-cover" priority unoptimized />
                        ) : (
                            <User className="size-3.5 text-purple-600" />
                        )}
                    </div>
                    <span className="hidden @[1200px]:inline">Mijn profiel</span>
                </Link>
            ) : (
                <button
                    onClick={() => {
                        void authClient.signIn.social({
                            provider: 'microsoft',
                            callbackURL: searchParams.get('callbackURL') || ROUTES.MEMBERSHIP
                        });
                    }}
                    className="squircle form-button flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                    Inloggen
                </button>
            )}
        </div>
    );
}
