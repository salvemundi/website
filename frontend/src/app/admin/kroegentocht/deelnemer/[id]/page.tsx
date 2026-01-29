'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { directusFetch } from '@/shared/lib/directus';
import { Loader2, AlertCircle, Save, ArrowLeft, Trash2 } from 'lucide-react';

export default function PubCrawlSignupEditPage() {
    const params = useParams();
    const router = useRouter();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [signup, setSignup] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        association: '',
        amount_tickets: 1,
        payment_status: 'open',
        name_initials: ''
    });

    useEffect(() => {
        loadData();
    }, [signupId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await directusFetch<any>(`/items/pub_crawl_signups/${signupId}?fields=*`);
            setSignup(data);
            setForm({
                name: (data as any).name || '',
                email: (data as any).email || '',
                association: (data as any).association || '',
                amount_tickets: (data as any).amount_tickets || 1,
                payment_status: (data as any).payment_status || 'open',
                name_initials: (data as any).name_initials || ''
            });
        } catch (err) {
            console.error('Failed to load pub crawl signup:', err);
            setError('Fout bij laden van inschrijving');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setForm(prev => ({ ...prev, [name]: name === 'amount_tickets' ? Number(value) : value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSaving(true);

        try {
            await directusFetch(`/items/pub_crawl_signups/${signupId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: form.name || undefined,
                    email: form.email || undefined,
                    association: form.association || undefined,
                    amount_tickets: form.amount_tickets,
                    payment_status: form.payment_status || undefined,
                    name_initials: form.name_initials || undefined
                })
            });

            setSuccess(true);
            await loadData();
            setTimeout(() => setSuccess(false), 2500);
        } catch (err: any) {
            console.error('Error saving pub crawl signup:', err);
            setError(err?.message || 'Fout bij opslaan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;
        try {
            await directusFetch(`/items/pub_crawl_signups/${signupId}`, { method: 'DELETE' });
            router.push('/admin/kroegentocht');
        } catch (err) {
            console.error('Failed to delete:', err);
            setError('Fout bij verwijderen');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-theme-purple" /></div>;

    if (!signup) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold">Inschrijving niet gevonden</h1>
            </div>
        </div>
    );

    return (
        <>
            <PageHeader title="Kroegentocht inschrijving bewerken" />

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <button onClick={() => router.push('/admin/kroegentocht')} className="flex items-center gap-2 text-theme-purple hover:text-theme-purple-light mb-6">
                    <ArrowLeft className="h-5 w-5" /> Terug naar overzicht
                </button>

                {success && <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 rounded"><p className="text-green-700 dark:text-green-300 font-semibold">Wijzigingen succesvol opgeslagen!</p></div>}
                {error && <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 rounded"><p className="text-red-700 dark:text-red-300">{error}</p></div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-admin-card rounded-lg shadow p-6 border border-admin">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-admin mb-2">Naam</label>
                                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2 border border-admin rounded-lg bg-admin-card text-admin" required />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-admin mb-2">Email</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 border border-admin rounded-lg bg-admin-card text-admin" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-admin mb-2">Vereniging</label>
                                    <input type="text" name="association" value={form.association} onChange={handleChange} className="w-full px-4 py-2 border border-admin rounded-lg bg-admin-card text-admin" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-admin mb-2">Tickets</label>
                                    <input type="number" min={1} name="amount_tickets" value={form.amount_tickets} onChange={handleChange} className="w-full px-4 py-2 border border-admin rounded-lg bg-admin-card text-admin" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-admin mb-2">Groepsleden (JSON)</label>
                                <textarea name="name_initials" value={form.name_initials} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-admin rounded-lg bg-admin-card text-admin" />
                                <p className="text-xs text-admin-muted mt-1">Optioneel: JSON lijst met deelnemers, bv: <code>{'[{"name":"Jan","initial":"J"}]'}</code></p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-admin mb-2">Betaalstatus</label>
                                <select name="payment_status" value={form.payment_status} onChange={handleChange} className="w-full px-4 py-2 border border-admin rounded-lg bg-admin-card text-admin">
                                    <option value="paid">Betaald</option>
                                    <option value="open">Open</option>
                                    <option value="cancelled">Geannuleerd</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            <Trash2 className="h-5 w-5" /> Verwijderen
                        </button>

                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-light disabled:opacity-50 transition">
                            {saving ? (<><Loader2 className="animate-spin h-5 w-5" /> Opslaan...</>) : (<><Save className="h-5 w-5" /> Wijzigingen opslaan</>)}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
