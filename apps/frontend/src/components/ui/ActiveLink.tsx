'use client';

import React from 'react';
import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { isPathActive } from '@/lib/utils/link-utils';

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & LinkProps & {
    exact?: boolean;
    children: React.ReactNode;
};

export default function ActiveLink({ href, exact, children, ...rest }: Props) {
    const pathname = usePathname() || '/';
    const asHref = typeof href === 'string' ? href : href.pathname || '/';
    const active = isPathActive(pathname, asHref, !!exact);

    return (
        <Link
            href={href}
            data-active={active || undefined}
            aria-current={active ? 'page' : undefined}
            {...rest}
        >
            {children}
        </Link>
    );
}
