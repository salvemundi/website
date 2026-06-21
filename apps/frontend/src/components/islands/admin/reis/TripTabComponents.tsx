export const inputClass = 'w-full px-5 py-4 rounded-xl bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-(--beheer-border)/40 text-(--beheer-text) text-sm font-semibold focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 outline-none transition-all shadow-inner placeholder:text-(--beheer-text-muted)/40';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`space-y-2 group/field ${className}`}>
            <label className="text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) group-focus-within/field:text-(--beheer-accent) transition-colors px-1 uppercase opacity-70">{label}</label>
            <div className="relative">
                {children}
            </div>
        </div>
    );
}
