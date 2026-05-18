'use client';

import React from 'react';
import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { isPathActive } from '@/lib/utils/link-utils';

type Props = LinkProps & {
    exact?: boolean;
    className?: string;
    activeClassName?: string;
    children: React.ReactNode;
};

export default function ActiveLink({ href, exact, className, activeClassName, children, ...rest }: Props) {
    const pathname = usePathname() || '/';
    const asHref = typeof href === 'string' ? href : href.pathname || '/';
    const active = isPathActive(pathname, asHref, !!exact);

    return (
        <Link
            href={href}
            className={cn(className, active && activeClassName)}
            aria-current={active ? 'page' : undefined}
            {...rest}
        >
            {children}
        </Link>
    );
}
