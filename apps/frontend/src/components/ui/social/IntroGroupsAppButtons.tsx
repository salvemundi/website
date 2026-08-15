import { MessageCircle, ExternalLink } from 'lucide-react';
import type { WhatsAppGroup } from '@salvemundi/validations/schema/profiel.zod';

interface IntroGroupsAppButtonsProps {
    groups: WhatsAppGroup[];
}

export default function IntroGroupsAppButtons({ groups }: IntroGroupsAppButtonsProps) {
    if (groups.length === 0) {
        return (
            <p className="text-sm text-text-muted font-medium">
                De groepsapp-uitnodiging volgt binnenkort.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.map(group => (
                <a
                    key={group.id}
                    href={group.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 squircle bg-purple-600 px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                >
                    <span className="flex items-center gap-3 min-w-0">
                        <MessageCircle className="h-5 w-5 shrink-0" />
                        <span className="min-w-0">
                            <span className="block font-semibold text-sm truncate">{group.name}</span>
                            {group.description && (
                                <span className="block text-xs text-white/80 truncate">{group.description}</span>
                            )}
                        </span>
                    </span>
                    <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 shrink-0" />
                </a>
            ))}
        </div>
    );
}
