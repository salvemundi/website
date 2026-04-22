export const inputClass = 'w-full px-5 py-4 rounded-xl bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 text-[var(--beheer-text)] text-sm font-semibold focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 outline-none transition-all shadow-inner placeholder:text-[var(--beheer-text-muted)]/40';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`space-y-2 group/field ${className}`}>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <div className="relative">
                {children}
            </div>
        </div>
    );
}
