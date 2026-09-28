'use client';

import { ChevronRight, CreditCard, MessageCircle, Briefcase, FileSignature, Users } from 'lucide-react';
import { Tile, QuickLink } from './ProfielUI';
import { ROUTES } from '@/lib/config/routes';

interface ProfielQuickLinksProps {
    user?: {
        membership_status?: string | null;
    };
}

export default function ProfielQuickLinks({ user = {} }: ProfielQuickLinksProps) {
    const isMember = user.membership_status === 'active';
    return (
        <Tile title="Snelle links" icon={<ChevronRight className="size-5" />} className="h-fit">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <QuickLink
                    label="Lidmaatschap"
                    icon={<CreditCard className="size-6" />}
                    href="/lidmaatschap"
                />
                <QuickLink
                    label="Transacties"
                    icon={<CreditCard className="size-6" />}
                    href="/profiel/transacties"
                />
                <QuickLink
                    label="WhatsApp"
                    icon={<MessageCircle className="size-6" />}
                    href="/profiel/whatsapp"
                    locked={!isMember}
                />
                <QuickLink
                    label="Bijbanenbank"
                    icon={<Briefcase className="size-6" />}
                    href={ROUTES.BIJBANENBANK}
                />
                <QuickLink
                    label="Clubs"
                    icon={<Users className="size-6" />}
                    href={ROUTES.CLUBS}
                />
                <QuickLink
                    label="Mijn NDA's"
                    icon={<FileSignature className="size-6" />}
                    href="/profiel/nda"
                />
            </div>
        </Tile>
    );
}
