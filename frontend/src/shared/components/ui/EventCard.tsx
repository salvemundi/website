interface EventCardProps {
    title: string;
    category: string;
    date: string;
    tag?: 'competition' | 'show' | 'workshop' | 'social' | null;
}

const tagStyles = {
    competition: 'bg-theme-purple/10 text-theme-purple',
    show: 'bg-theme-purple-light/10 text-theme-purple-light',
    workshop: 'bg-theme-purple-dark/10 text-theme-purple-dark',
    social: 'bg-theme-purple-lighter/20 text-theme-purple',
};

export default function EventCard({ title, category, date, tag }: EventCardProps) {
    return (
        <article className="group relative overflow-hidden rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">
            <span className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-theme-purple/20 transition duration-500 group-hover:scale-125" />

            <div className="relative space-y-3">
                {tag && (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tagStyles[tag] || 'bg-theme-purple/10 text-theme-purple'}`}>
                        {tag}
                    </span>
                )}

                <h3 className="text-lg font-bold text-theme line-clamp-2">{title}</h3>

                <p className="text-sm text-theme-muted">{category}</p>

                <div className="flex items-center gap-2 text-sm text-theme-purple">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{date}</span>
                </div>
            </div>
        </article>
    );
}
