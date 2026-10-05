export const inputClass = 'beheer-input';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`group/field space-y-2 ${className}`}>
            <label className="mail-field-label group-focus-within/field:text-beheer-accent">{label}</label>
            <div className="relative">
                {children}
            </div>
        </div>
    );
}
