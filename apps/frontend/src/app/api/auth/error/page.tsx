import Link from 'next/link';

export default function Page() {
    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
            <div 
                className="max-w-md w-full p-10 rounded-[var(--radius-2xl)] shadow-xl border border-[var(--border-color)] transition-all"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
            >
                <div className="mb-6 flex justify-center">
                    <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(var(--color-purple-500-rgb), 0.1)' }}>
                        <svg className="w-12 h-12" style={{ color: 'var(--theme-error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
                
                <h1 className="text-3xl font-extrabold mb-4 tracking-tight" style={{ color: 'var(--text-main)' }}>
                    Login Mislukt
                </h1>
                
                <p className="mb-10 leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
                    Er is een fout opgetreden tijdens het inloggen. Probeer het opnieuw of neem contact op met de ICT-commissie voor ondersteuning.
                </p>
                
                <Link
                    href="/"
                    className="inline-block w-full text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    style={{ 
                        background: 'linear-gradient(to right, var(--color-purple-500), var(--color-purple-600))',
                    }}
                >
                    Terug naar de homepage
                </Link>
            </div>
        </div>
    );
}
