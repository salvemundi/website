'use client';

import { CreditCard, MessageCircle, Briefcase, FileSignature, Users, Pizza, Camera } from 'lucide-react';
import { SimpleGrid } from '@mantine/core';
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
        <Tile title="Snelle links">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <QuickLink
                    label="Lidmaatschap"
                    icon={<CreditCard size={22} />}
                    href="/lidmaatschap"
                />
                <QuickLink
                    label="Transacties"
                    icon={<CreditCard size={22} />}
                    href="/profiel/transacties"
                />
                <QuickLink
                    label="WhatsApp"
                    icon={<MessageCircle size={22} />}
                    href="/profiel/whatsapp"
                    locked={!isMember}
                />
                <QuickLink
                    label="Bijbanenbank"
                    icon={<Briefcase size={22} />}
                    href={ROUTES.BIJBANENBANK}
                />
                <QuickLink
                    label="Clubs"
                    icon={<Users size={22} />}
                    href={ROUTES.CLUBS}
                />
                <QuickLink
                    label="Pizza-rondes"
                    icon={<Pizza size={22} />}
                    href={ROUTES.PIZZA}
                />
                <QuickLink
                    label="Camera aanvragen"
                    icon={<Camera size={22} />}
                    href={ROUTES.CAMERA}
                    locked={!isMember}
                />
                <QuickLink
                    label="Mijn NDA's"
                    icon={<FileSignature size={22} />}
                    href="/profiel/nda"
                />
            </SimpleGrid>
        </Tile>
    );
}
