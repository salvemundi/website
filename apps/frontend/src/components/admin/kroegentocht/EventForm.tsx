'use client';

import { useState, useTransition } from 'react';
import { 
    Save, 
    Loader2, 
    ArrowLeft, 
    Calendar, 
    Type, 
    FileText, 
    Mail,
    ImagePlus,
    X,
    Building2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { upsertPubCrawlEvent, uploadPubCrawlImage } from '@/server/actions/admin-kroegentocht.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface EventFormProps {
    event?: any;
}

export default function EventForm({ event }: EventFormProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        name: event?.name || '',
        description: event?.description || '',
        date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
        email: event?.email || 'intro@salvemundi.nl',
        association: event?.association || 'Salve Mundi',
        image: event?.image || null,
    });
    const [uploading, setUploading] = useState(false);

    const isEdit = !!event?.id;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const result = await uploadPubCrawlImage(uploadData);
            setFormData(prev => ({ ...prev, image: result.id }));
            showToast('Afbeelding succesvol geüpload', 'success');
        } catch (err) {
            showToast('Upload mislukt: ' + err, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                await upsertPubCrawlEvent({
                    ...formData,
                    id: event?.id
                });
                showToast('Event succesvol opgeslagen', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (err) {
                showToast('Fout bij opslaan: ' + err, 'error');
            }
        });
    };

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 overflow-hidden">
                <div className="p-8 border-b border-[var(--border-color)]/30 bg-[var(--bg-main)]/30">
                    <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-[var(--theme-purple)]" />
                        Event <span className="text-[var(--theme-purple)]">Details</span>
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Configureer de basisgegevens voor de kroegentocht</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Type className="h-3 w-3" /> Event Naam
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                                placeholder="Bijv. Kroegentocht Stratumseind"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Datum
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                            <FileText className="h-3 w-3" /> Beschrijving
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)] min-h-[120px]"
                            placeholder="Korte omschrijving voor de deelnemers..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Contact E-mail
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                                placeholder="Bijv. intro@salvemundi.nl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Gast-Vereniging
                            </label>
                            <input
                                type="text"
                                value={formData.association}
                                onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                                placeholder="Standaard: Salve Mundi"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <ImagePlus className="h-3 w-3" /> Event Afbeelding
                            </label>
                            <div className="relative group/img">
                                {formData.image ? (
                                    <div className="relative w-full h-40 rounded-[var(--radius-xl)] overflow-hidden border-2 border-[var(--theme-purple)]/30">
                                        <img 
                                            src={`http://100.77.182.130:8055/assets/${formData.image}?width=400`} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-40 bg-[var(--bg-main)]/50 border-2 border-dashed border-[var(--border-color)]/50 rounded-[var(--radius-xl)] hover:border-[var(--theme-purple)]/50 hover:bg-[var(--theme-purple)]/5 transition-all cursor-pointer">
                                        {uploading ? (
                                            <Loader2 className="h-8 w-8 text-[var(--theme-purple)] animate-spin" />
                                        ) : (
                                            <>
                                                <ImagePlus className="h-8 w-8 text-[var(--text-muted)] mb-2" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Upload Image</span>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center gap-4">
                <Link 
                    href="/beheer/kroegentocht"
                    className="flex items-center gap-2 px-8 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-xl)] text-xs font-black uppercase tracking-widest text-[var(--text-light)] hover:text-[var(--theme-purple)] transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Annuleren
                </Link>

                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-5 bg-[var(--theme-purple)] text-white font-black text-sm uppercase tracking-[0.2em] rounded-[var(--radius-xl)] shadow-[var(--shadow-glow)] hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    {isEdit ? 'Wijzigingen Opslaan' : 'Event Aanmaken'}
                </button>
            </div>
        </form>
        <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
