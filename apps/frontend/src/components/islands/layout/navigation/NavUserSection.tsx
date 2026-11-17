'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { User, Shield } from 'lucide-react';
import { authClient } from '@/lib/auth';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ROUTES } from '@/lib/config/routes';
import { getLoginCallbackURL } from '@/lib/utils/login-redirect';
import { Button } from '@/components/ui/button';
import { type ExtendedSession } from '@/types/auth';

interface NavUserSectionProps {
    initialSession: ExtendedSession | null | undefined;
    canAccessAdmin: boolean;
}

export function NavUserSection({ initialSession, canAccessAdmin }: NavUserSectionProps) {
    const searchParams = useSearchParams();

    const session = initialSession;
    const user = session?.user ?? null;
    const isAuthenticated = !!user;

    const showAdmin = isAuthenticated && canAccessAdmin;

    return (
        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 lg:gap-2">
            {showAdmin && (
                <Button asChild size="sm">
                    <Link href={ROUTES.ADMIN}>
                        <Shield className="size-4 shrink-0" />
                        <span className="hidden @[1200px]:inline">Beheer</span>
                    </Link>
                </Button>
            )}

            {isAuthenticated ? (
                <Button asChild variant="secondary" size="sm">
                    <Link href={ROUTES.ACCOUNT}>
                        <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15">
                            {user.avatar ? (
                                <Image src={getImageUrl(user.avatar)} alt={user.name || 'Profiel'} fill className="object-cover" priority unoptimized />
                            ) : (
                                <User className="size-3.5 text-primary" />
                            )}
                        </div>
                        <span className="hidden @[1200px]:inline">Mijn profiel</span>
                    </Link>
                </Button>
            ) : (
                <Button
                    size="sm"
                    onClick={() => {
                        void authClient.signIn.social({
                            provider: 'microsoft',
                            callbackURL: getLoginCallbackURL(searchParams.get('callbackURL'), ROUTES.MEMBERSHIP)
                        });
                    }}
                    type="button"
                >
                    Inloggen
                </Button>
            )}
        </div>
    );
}
