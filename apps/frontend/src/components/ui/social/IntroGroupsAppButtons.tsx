import { MessageCircle, ExternalLink } from 'lucide-react';
import type { WhatsAppGroup } from '@salvemundi/validations/schema/profiel.zod';

interface IntroGroupsAppButtonsProps {
    groups: WhatsAppGroup[];
}

export default function IntroGroupsAppButtons({ groups }: IntroGroupsAppButtonsProps) {
    if (groups.length === 0) {
        return (
            <p className="text-sm font-medium text-text-muted">
                De groepsapp-uitnodiging volgt binnenkort.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {groups.map(group => (
                <a
                    key={group.id}
                    href={group.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group squircle hover:scale-1.01 flex items-start justify-between gap-3 bg-purple-600 px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl"
                >
                    <span className="flex min-w-0 items-start gap-3">
                        <MessageCircle className="mt-0.5 size-5 shrink-0" />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">{group.name}</span>
                            {group.description && (
                                <span className="mt-1 block text-xs leading-relaxed whitespace-pre-wrap text-white/80">{group.description}</span>
                            )}
                        </span>
                    </span>
                    <ExternalLink className="mt-0.5 size-4 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
            ))}
        </div>
    );
}
