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
                    className="beheer-button beheer-button h-9 shrink-0"
                >
                    <Shield className="size-4 shrink-0" />
                    <span className="hidden @[1200px]:inline">Beheer</span>
                </Link>
            )}

            {isAuthenticated ? (
                <Link
                    href={ROUTES.ACCOUNT}
                    className="btn-secondary h-9 shrink-0 px-3.5"
                >
                    <div className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-theme-purple/10">
                        {user.avatar ? (
                            <Image src={getImageUrl(user.avatar)} alt={user.name || 'Profiel'} fill className="object-cover" priority unoptimized />
                        ) : (
                            <User className="size-3 text-theme-purple" />
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
                    className="form-button h-9 shrink-0"
                    type="button">
                    Inloggen
                </button>
            )}
        </div>
    );
}
