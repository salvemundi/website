'use client';

import { ChevronRight, CreditCard, MessageCircle, Briefcase, ClipboardCheck } from 'lucide-react';
import { Tile, QuickLink } from './ProfielUI';
import { ROUTES } from '@/lib/config/routes';

interface ProfielQuickLinksProps {
    user?: {
        membership_status?: string | null;
    };
    introAttendance?: { visible: boolean; hasAccess: boolean };
}

export default function ProfielQuickLinks({ user = {}, introAttendance }: ProfielQuickLinksProps) {
    const isMember = user.membership_status === 'active';
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
                    locked={!isMember}
                />
                <QuickLink
                    label="Bijbanenbank"
                    icon={<Briefcase className="h-6 w-6" />}
                    href={ROUTES.BIJBANENBANK}
                />
                {introAttendance?.visible && (
                    <QuickLink
                        label="Groepje Aanwezigheid"
                        icon={<ClipboardCheck className="h-6 w-6" />}
                        href="/profiel/intro-attendance"
                        locked={!introAttendance.hasAccess}
                    />
                )}
            </div>
        </Tile>
    );
}
