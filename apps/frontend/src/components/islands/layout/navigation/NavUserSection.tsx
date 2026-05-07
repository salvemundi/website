'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Shield } from 'lucide-react';
import { authClient } from '@/lib/auth';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ROUTES } from '@/lib/config/routes';

interface NavUserSectionProps {
    initialSession: any;
    canAccessAdmin: boolean;
}

export function NavUserSection({ initialSession, canAccessAdmin }: NavUserSectionProps) {
    const { data: sessionData } = authClient.useSession();
    const session = sessionData || initialSession;
    const user = session?.user;
    const isAuthenticated = !!user;

    return (
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 flex-nowrap">
            {canAccessAdmin && (
                <Link
                    href={ROUTES.ADMIN}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-[var(--color-white)] px-3 py-1.5 h-8 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg shrink-0"
                >
                    <Shield className="h-4 w-4 shrink-0" />
                    <span className="hidden xl:inline">Admin</span>
                </Link>
            )}

            {isAuthenticated ? (
                <Link
                    href={ROUTES.ACCOUNT}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 h-8 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg shrink-0"
                >
                    <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0 bg-[var(--color-purple-50)] dark:bg-white/10 flex items-center justify-center">
                        {user.avatar ? (
                            <Image src={getImageUrl(user.avatar)} alt={user.name || 'Profiel'} fill className="object-cover" priority unoptimized />
                        ) : (
                            <User className="h-3.5 w-3.5 text-[var(--color-purple-600)]" />
                        )}
                    </div>
                    <span className="hidden sm:inline">Mijn profiel</span>
                </Link>
            ) : (
                <button
                    onClick={() => authClient.signIn.social({ 
                        provider: 'microsoft', 
                        callbackURL: '/profiel'
                    })}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold px-3 py-1.5 h-8 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg bg-[var(--color-purple-50)] text-[var(--color-purple-700)] shrink-0"
                >
                    Inloggen
                </button>
            )}
        </div>
    );
}
