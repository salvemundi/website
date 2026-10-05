'use client';

import { Upload, X, Save, Loader2, Eye, Check } from 'lucide-react';
import { useRef } from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface ReisFormSidebarProps {
    isAdding: boolean;
    pending: boolean;
    imagePreview: string | { id: string; type?: string | null } | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    onCancel: () => void;
    registrationOpen: boolean;
    setRegistrationOpen: (open: boolean) => void;
    allowFinalPayments: boolean;
    setAllowFinalPayments: (allow: boolean) => void;
    allowDepositPayments: boolean;
    setAllowDepositPayments: (allow: boolean) => void;
    isBusTrip: boolean;
    setIsBusTrip: (isBus: boolean) => void;
    registrationStartDate?: string | null;
}

export default function ReisFormSidebar({
    isAdding,
    pending,
    imagePreview,
    onImageChange,
    onRemoveImage,
    onCancel,
    registrationOpen,
    setRegistrationOpen,
    allowFinalPayments,
    setAllowFinalPayments,
    allowDepositPayments,
    setAllowDepositPayments,
    isBusTrip,
    setIsBusTrip,
    registrationStartDate
}: ReisFormSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAutoOpen = !registrationOpen && registrationStartDate && new Date(registrationStartDate) <= new Date();

    return (
        <div className="space-y-6 lg:sticky lg:top-8 lg:col-span-4">
            <div className="overflow-hidden rounded-beheer border border-beheer-border bg-beheer-card-bg shadow-xl">
                <div className="flex items-center gap-3 border-b border-beheer-border bg-beheer-card-soft/50 px-6 py-4">
                    <Upload className="size-4 text-beheer-accent" />
                    <h2 className="text-2xs font-semibold tracking-widest text-beheer-text">Banner</h2>
                </div>
                <div className="p-4">
                    {!imagePreview ? (
                        <div onClick={() => fileInputRef.current?.click()} className="group flex min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-beheer-border bg-beheer-card-soft transition-all hover:border-beheer-accent hover:bg-beheer-accent/5">
                            <Upload className="mb-2 size-6 text-beheer-text-muted transition-colors group-hover:text-beheer-accent" />
                            <span className="px-4 text-center text-xs font-semibold tracking-widest text-beheer-text-muted group-hover:text-beheer-accent">Upload banner (afbeelding of video)</span>
                            <input ref={fileInputRef} type="file" name="image_file" accept="image/*,video/*" onChange={onImageChange} className="hidden" />
                        </div>
                    ) : (
                        <div className="group relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-beheer-border bg-beheer-card-soft/50">
                            <MediaAsset
                                asset={imagePreview}
                                alt="Preview"
                                fill
                                objectFit="contain"
                                unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="icon-button bg-beheer-card-bg p-2.5 text-beheer-text hover:bg-beheer-card-soft"><Upload className="size-4" /></button>
                                <button type="button" onClick={onRemoveImage} className="icon-button bg-rose-600 p-2.5 hover:bg-rose-700"><X className="size-4" /></button>
                            </div>
                            <input ref={fileInputRef} type="file" name="image_file" accept="image/*,video/*" onChange={onImageChange} className="hidden" />
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-beheer border border-beheer-border bg-beheer-card-bg shadow-xl">
                <div className="flex items-center gap-3 border-b border-beheer-border bg-beheer-card-soft/50 px-6 py-4">
                    <Eye className="size-4 text-beheer-accent" />
                    <h2 className="text-2xs font-semibold tracking-widest text-beheer-text">Instellingen</h2>
                </div>
                    <div className="space-y-3 p-4">
                        <label className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-beheer-border/30 bg-beheer-card-soft/30 p-3 transition-all hover:bg-beheer-card-soft/50">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" checked={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.checked)} className="peer sr-only" />
                                <div className="size-5 rounded border-2 border-beheer-border transition-all peer-checked:border-beheer-accent peer-checked:bg-beheer-accent"></div>
                                <Check className="absolute size-3 text-wit-paars opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <span className="text-2xs font-semibold tracking-widest text-beheer-text-muted transition-colors group-hover:text-beheer-text">Inschrijving Open</span>
                            {isAutoOpen && (
                                <div className="ml-auto animate-pulse rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-black tracking-tighter text-emerald-500 uppercase">
                                    Auto-Open Actief
                                </div>
                            )}
                        </label>

                        <label className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-beheer-border/30 bg-beheer-card-soft/30 p-3 transition-all hover:bg-beheer-card-soft/50">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" checked={allowDepositPayments} onChange={(e) => setAllowDepositPayments(e.target.checked)} className="peer sr-only" />
                                <div className="size-5 rounded border-2 border-beheer-border transition-all peer-checked:border-beheer-accent peer-checked:bg-beheer-accent"></div>
                                <Check className="absolute size-3 text-wit-paars opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <span className="text-2xs font-semibold tracking-widest text-beheer-text-muted transition-colors group-hover:text-beheer-text">Aanbetalingen Open</span>
                        </label>

                        <label className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-beheer-border/30 bg-beheer-card-soft/30 p-3 transition-all hover:bg-beheer-card-soft/50">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" checked={allowFinalPayments} onChange={(e) => setAllowFinalPayments(e.target.checked)} className="peer sr-only" />
                                <div className="size-5 rounded border-2 border-beheer-border transition-all peer-checked:border-beheer-accent peer-checked:bg-beheer-accent"></div>
                                <Check className="absolute size-3 text-wit-paars opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <span className="text-2xs font-semibold tracking-widest text-beheer-text-muted transition-colors group-hover:text-beheer-text">Restbetalingen Aan</span>
                        </label>

                        {allowFinalPayments && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                                <p className="text-2xs leading-relaxed font-bold tracking-widest text-amber-600 uppercase">
                                    Let op: Het inschakelen van restbetalingen sluit automatisch nieuwe inschrijvingen voor deze reis.
                                </p>
                            </div>
                        )}

                        <label className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-beheer-border/30 bg-beheer-card-soft/30 p-3 transition-all hover:bg-beheer-card-soft/50">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" checked={isBusTrip} onChange={(e) => setIsBusTrip(e.target.checked)} className="peer sr-only" />
                                <div className="size-5 rounded border-2 border-beheer-border transition-all peer-checked:border-beheer-accent peer-checked:bg-beheer-accent"></div>
                                <Check className="absolute size-3 text-wit-paars opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <span className="text-2xs font-semibold tracking-widest text-beheer-text-muted transition-colors group-hover:text-beheer-text">Busreis (Rijbewijs)</span>
                        </label>
                    </div>
                </div>

            <div className="space-y-3">
                <button 
                    type="submit" 
                    disabled={pending} 
                    className="form-button w-full border tracking-widest"
                >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    <span>{pending ? 'Bezig...' : isAdding ? 'Reis Aanmaken' : 'Wijzigingen Opslaan'}</span>
                </button>
                
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="beheer-button-secondary w-full tracking-widest"
                >
                    Annuleren
                </button>
            </div>
        </div>
    );
}
