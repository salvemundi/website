interface EventCardProps {
    title: string;
    category: string;
    date: string;
    tag?: 'competition' | 'show' | 'workshop' | 'social' | null;
}

const tagStyles = {
    competition: 'bg-oranje/10 text-paars',
    show: 'bg-purple-100 text-purple-700',
    workshop: 'bg-blue-100 text-blue-700',
    social: 'bg-orange-100 text-orange-700',
};

export default function EventCard({ title, category, date, tag }: EventCardProps) {
    return (
        <article className="group relative overflow-hidden rounded-[1.75rem] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">
            <span className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-oranje/20/60 transition duration-500 group-hover:scale-125" />

            <div className="relative space-y-3">
                {tag && (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tagStyles[tag] || 'bg-gray-100 text-gray-700'}`}>
                        {tag}
                    </span>
                )}

                <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{title}</h3>

                <p className="text-sm text-slate-600">{category}</p>

                <div className="flex items-center gap-2 text-sm text-oranje">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{date}</span>
                </div>
            </div>
        </article>
    );
}
