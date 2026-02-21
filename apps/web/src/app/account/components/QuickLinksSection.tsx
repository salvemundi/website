import {
    CreditCard,
    MessageCircle,
    FileText,
    Shield,
    ExternalLink,
    ChevronRight,
    Lock,
} from "lucide-react";

interface QuickLinkProps {
    label: string;
    icon: React.ReactNode;
    href: string;
    locked?: boolean;
    external?: boolean;
}

function QuickLink({ label, icon, href, locked, external }: QuickLinkProps) {
    return (
        <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-purple/30 border border-slate-200 dark:border-white/10 hover:border-theme-purple/30 dark:hover:border-white/20 shadow-sm w-full hover:-translate-y-0.5"
        >
            <div className="rounded-xl bg-theme-purple/10 dark:bg-white/10 p-2.5 text-theme-purple dark:text-white transition-transform group-hover:scale-110 shadow-sm">
                {icon}
            </div>
            <span className="flex-1 flex items-center justify-between text-sm font-bold text-theme-purple dark:text-white">
                <span>{label}</span>
                <div className="flex items-center gap-2">
                    {locked ? <Lock className="h-3 w-3 opacity-50" /> : null}
                    {external ? <ExternalLink className="h-3 w-3 opacity-50" /> : null}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
            </span>
        </a>
    );
}

interface QuickLinksSectionProps {
    membershipStatus: "active" | "expired" | "none";
    isCommitteeMember: boolean;
}

export default function QuickLinksSection({
    membershipStatus,
    isCommitteeMember,
}: QuickLinksSectionProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink
                label="Transacties"
                icon={<CreditCard className="h-6 w-6" />}
                href="/account/transacties"
            />
            <QuickLink
                label="WhatsApp"
                icon={<MessageCircle className="h-6 w-6" />}
                href="/account/whatsapp-groepen"
                locked={membershipStatus !== "active"}
            />
            <QuickLink
                label="SharePoint"
                icon={<FileText className="h-6 w-6" />}
                href="https://salvemundi.sharepoint.com"
                external
            />
            {isCommitteeMember ? (
                <QuickLink
                    label="Admin panel"
                    icon={<Shield className="h-6 w-6" />}
                    href="https://admin.salvemundi.nl"
                    external
                />
            ) : null}
        </div>
    );
}
