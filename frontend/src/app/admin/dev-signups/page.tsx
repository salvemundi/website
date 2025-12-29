'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { format } from 'date-fns';
import { Shield, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

interface PendingSignup {
    id: number;
    date_created: string;
    product_name: string;
    amount: string;
    email: string;
    environment: string;
    approval_status: string;
    payment_status: string;
}

function Tile({
    title,
    icon,
    children,
    className = '',
    actions,
}: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section
            className={[
                'relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end shadow-lg',
                className,
            ].join(' ')}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

            <div className="relative p-6 sm:p-7">
                {(title || actions) && (
                    <header className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon ? (
                                <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-theme-purple-lighter">
                                    {icon}
                                </div>
                            ) : null}
                            {title ? (
                                <h2 className="truncate text-lg font-bold text-theme-purple-lighter">
                                    {title}
                                </h2>
                            ) : null}
                        </div>

                        {actions ? <div className="shrink-0">{actions}</div> : null}
                    </header>
                )}

                {children}
            </div>
        </section>
    );
}

export default function DevSignupsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [signups, setSignups] = useState<PendingSignup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        // Check if user is admin (has entra_id)
        if (user && !user.entra_id) {
            router.push('/account');
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.entra_id) {
            loadPendingSignups();
        }
    }, [user]);

    const loadPendingSignups = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch('/api/admin/pending-signups', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pending signups');
            }

            const data = await response.json();
            setSignups(data.signups || []);
        } catch (error) {
            console.error('Failed to load pending signups:', error);
            alert('Kon pending inschrijvingen niet laden. Controleer de console voor details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (signupId: number) => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt goedkeuren? Er wordt een account aangemaakt.')) {
            return;
        }

        setIsProcessing(signupId);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`/api/admin/approve-signup/${signupId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve signup');
            }

            alert('Inschrijving goedgekeurd! Account wordt aangemaakt.');
            await loadPendingSignups();
        } catch (error: any) {
            console.error('Failed to approve signup:', error);
            alert(`Fout bij goedkeuren: ${error.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (signupId: number) => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt afwijzen? Er wordt GEEN account aangemaakt.')) {
            return;
        }

        setIsProcessing(signupId);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`/api/admin/reject-signup/${signupId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject signup');
            }

            alert('Inschrijving afgewezen.');
            await loadPendingSignups();
        } catch (error: any) {
            console.error('Failed to reject signup:', error);
            alert(`Fout bij afwijzen: ${error.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    const formatAmount = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(numAmount);
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="text-theme-purple-lighter text-xl font-semibold">
                    Laden...
                </div>
            </div>
        );
    }

    if (!user.entra_id) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="text-theme-purple-lighter text-xl font-semibold">
                    Geen toegang - alleen admins
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-theme-purple-lighter flex items-center gap-3">
                        <Shield className="h-8 w-8" />
                        Development Inschrijvingen
                    </h1>
                    <p className="mt-1 text-sm text-theme-purple-lighter/60">
                        Goedkeuren of afwijzen van test-inschrijvingen in de development omgeving.
                    </p>
                </div>

                {/* Main Content */}
                <Tile
                    title="Pending Signups"
                    icon={<Clock className="h-5 w-5" />}
                    actions={
                        <button
                            onClick={loadPendingSignups}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-theme-purple-lighter hover:bg-white/15 border border-white/10 transition disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Ververs
                        </button>
                    }
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                            <p className="mt-4 text-theme-purple-lighter/60">Laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-theme-purple/10 bg-white/30 p-8 text-center">
                            <p className="text-theme-purple-lighter font-medium">
                                Geen pending inschrijvingen.
                            </p>
                            <p className="mt-2 text-sm text-theme-purple-lighter/60">
                                Alle development signups zijn verwerkt of er zijn geen nieuwe.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-theme-purple-lighter/60">
                                                Datum
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-theme-purple-lighter/60">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-theme-purple-lighter/60">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-theme-purple-lighter/60">
                                                Bedrag
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-theme-purple-lighter/60">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-theme-purple-lighter/60">
                                                Acties
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {signups.map((signup) => (
                                            <tr key={signup.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {format(new Date(signup.date_created), 'd MMM yyyy HH:mm')}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter font-medium">
                                                    {signup.email || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {signup.product_name}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-semibold text-theme-purple-lighter">
                                                    {formatAmount(signup.amount)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
                                                        {signup.payment_status === 'paid' ? 'Betaald' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(signup.id)}
                                                            disabled={isProcessing === signup.id || signup.payment_status !== 'paid'}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                            Goedkeuren
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(signup.id)}
                                                            disabled={isProcessing === signup.id}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Afwijzen
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {signups.map((signup) => (
                                    <div
                                        key={signup.id}
                                        className="rounded-2xl bg-white/40 p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-theme-purple-lighter">
                                                    {signup.email || 'N/A'}
                                                </h3>
                                                <p className="text-sm text-theme-purple-lighter/70">
                                                    {format(new Date(signup.date_created), 'd MMM yyyy HH:mm')}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
                                                {signup.payment_status === 'paid' ? 'Betaald' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-theme-purple-lighter mb-2">
                                            {signup.product_name}
                                        </p>
                                        <p className="text-lg font-bold text-theme-purple-lighter mb-3">
                                            {formatAmount(signup.amount)}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(signup.id)}
                                                disabled={isProcessing === signup.id || signup.payment_status !== 'paid'}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Goedkeuren
                                            </button>
                                            <button
                                                onClick={() => handleReject(signup.id)}
                                                disabled={isProcessing === signup.id}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Afwijzen
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Tile>
            </div>
        </div>
    );
}
