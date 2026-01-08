"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { directusFetch, directusUrl } from '@/shared/lib/directus';
import { useAuth } from '@/features/auth/providers/auth-provider';

export default function AdminCommitteeEditPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const { user } = useAuth();

    const [committee, setCommittee] = useState<any>(null);
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const data = await directusFetch<any>(`/items/committees/${id}`);
                setCommittee(data || null);
                setShortDescription(data?.short_description || '');
                setDescription(data?.description || '');
            } catch (e) {
                console.error('Failed to load committee', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Determine leader permission from application storage or auth state
    const stored = user?.committees || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`user_committees_${user?.id}`) || 'null') || [] : []);
    const canEdit = !!stored?.find((c: any) => String(c.id) === String(id) && c.is_leader);

    const uploadFile = async (file: File) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const fd = new FormData();
        fd.append('file', file);

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(`${directusUrl}/files`, { method: 'POST', body: fd, headers });
        if (!resp.ok) throw new Error('Upload failed');
        const json = await resp.json();
        return json?.data?.id || json?.data;
    };

    const handleSave = async () => {
        if (!id || !canEdit) return alert('Geen rechten om dit te bewerken');
        setSaving(true);
        try {
            const payload: any = { short_description: shortDescription, description };
            if (imageFile) {
                const fileId = await uploadFile(imageFile);
                payload.image = fileId;
            }

            await directusFetch(`/items/committees/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            router.push(`/commissies/${committee ? encodeURIComponent((committee.name || '').replace(/\|\|\s*SALVE MUNDI/g, '').trim().replace(/\s+/g, '-').toLowerCase()) : '/commissies'}`);
        } catch (e) {
            console.error(e);
            alert('Opslaan mislukt');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Laden...</div>;
    if (!canEdit) return <div className="p-8">Je hebt geen rechten om deze pagina te bewerken.</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <PageHeader title="Bewerk Commissie" description="Pas korte omschrijving, volledige beschrijving en afbeelding aan" />

            <div className="bg-white rounded-2xl p-6 mt-6 shadow-lg">
                <label className="block mb-2 font-semibold">Korte omschrijving</label>
                <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full p-3 rounded-md border" />

                <label className="block mt-4 mb-2 font-semibold">Beschrijving (HTML)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="w-full p-3 rounded-md border" />

                <label className="block mt-4 mb-2 font-semibold">Banner afbeelding</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />

                <div className="mt-6 flex gap-3">
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-gradient-to-r from-oranje to-red-600 text-white font-semibold">{saving ? 'Opslaan...' : 'Opslaan'}</button>
                    <button onClick={() => router.back()} className="px-4 py-2 rounded-md border">Annuleren</button>
                </div>
            </div>
        </div>
    );
}
