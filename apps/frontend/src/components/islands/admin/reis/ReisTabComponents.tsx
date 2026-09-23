export const inputClass = 'beheer-input w-full px-5 py-4 rounded-xl bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-(--beheer-border)/40 text-(--beheer-text) text-sm font-semibold focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 outline-none transition-all shadow-inner placeholder:text-(--beheer-text-muted)/40';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`group/field space-y-2 ${className}`}>
            <label className="px-1 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-70 transition-colors group-focus-within/field:text-(--beheer-accent)">{label}</label>
            <div className="relative">
                {children}
            </div>
        </div>
    );
}
