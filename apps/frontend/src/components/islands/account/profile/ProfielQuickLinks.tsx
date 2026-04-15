'use client';

import React from 'react';
import { ChevronRight, CreditCard, MessageCircle, Shield } from 'lucide-react';
import { Tile, QuickLink } from './ProfielUI';

interface ProfielQuickLinksProps {
    user?: any;
    canAccessAdmin?: boolean;
}

export default function ProfielQuickLinks({ user = {}, canAccessAdmin = false }: ProfielQuickLinksProps) {
    return (
        <Tile title="Snelle links" icon={<ChevronRight className="h-5 w-5" />} className="h-fit">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickLink
                    label="Lidmaatschap"
                    icon={<CreditCard className="h-6 w-6" />}
                    href="/lidmaatschap"
                />
                <QuickLink
                    label="Transacties"
                    icon={<CreditCard className="h-6 w-6" />}
                    href="/profiel/transacties"
                />
                <QuickLink
                    label="WhatsApp"
                    icon={<MessageCircle className="h-6 w-6" />}
                    href="/profiel/whatsapp"
                    locked={user.membership_status !== "active"}
                />
                {canAccessAdmin && (
                    <QuickLink
                        label="Admin panel"
                        icon={<Shield className="h-6 w-6" />}
                        href={process.env.NEXT_PUBLIC_DIRECTUS_URL || "#"}
                        external
                    />
                )}
            </div>
        </Tile>
    );
}

