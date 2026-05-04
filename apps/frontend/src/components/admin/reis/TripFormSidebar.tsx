'use client';

import { Upload, X, Save, Loader2, Eye, Check } from 'lucide-react';
import { useRef, useState } from 'react';

interface TripFormSidebarProps {
    isAdding: boolean;
    pending: boolean;
    imagePreview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    onCancel: () => void;
    registrationOpen: boolean;
    setRegistrationOpen: (open: boolean) => void;
    allowFinalPayments: boolean;
    setAllowFinalPayments: (allow: boolean) => void;
    isBusTrip: boolean;
    setIsBusTrip: (isBus: boolean) => void;
}

export default function TripFormSidebar({
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
    isBusTrip,
    setIsBusTrip
}: TripFormSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            {/* Banner Section */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                    <Upload className="h-4 w-4 text-[var(--beheer-accent)]" />
                    <h2 className="text-[10px] font-semibold tracking-widest text-[var(--beheer-text)]">Banner</h2>
                </div>
                <div className="p-4">
                    {!imagePreview ? (
                        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-[var(--beheer-border)] rounded-xl cursor-pointer hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all bg-[var(--beheer-card-soft)] group">
                            <Upload className="h-6 w-6 mb-2 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors" />
                            <span className="text-[9px] font-semibold tracking-widest text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] text-center px-4">Upload banner</span>
                            <input ref={fileInputRef} type="file" name="image_file" accept="image/*" onChange={onImageChange} className="hidden" />
                        </div>
                    ) : (
                        <div className="relative group overflow-hidden rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 h-[160px] flex items-center justify-center">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-4 w-4" /></button>
                                <button type="button" onClick={onRemoveImage} className="bg-red-500 text-white p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-4 w-4" /></button>
                            </div>
                            <input ref={fileInputRef} type="file" name="image_file" accept="image/*" onChange={onImageChange} className="hidden" />
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Settings */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                    <Eye className="h-4 w-4 text-[var(--beheer-accent)]" />
                    <h2 className="text-[10px] font-semibold tracking-widest text-[var(--beheer-text)]">Instellingen</h2>
                </div>
                <div className="p-6 space-y-4">
                    <label className="relative flex items-center gap-4 bg-[var(--beheer-card-soft)]/30 p-3 rounded-xl border border-[var(--beheer-border)]/30 cursor-pointer group transition-all hover:bg-[var(--beheer-card-soft)]/50">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" name="registration_open" checked={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.checked)} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                            <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest group-hover:text-[var(--beheer-text)] transition-colors">Inschrijving Open</span>
                    </label>

                    <label className="relative flex items-center gap-4 bg-[var(--beheer-card-soft)]/30 p-3 rounded-xl border border-[var(--beheer-border)]/30 cursor-pointer group transition-all hover:bg-[var(--beheer-card-soft)]/50">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" name="allow_final_payments" checked={allowFinalPayments} onChange={(e) => setAllowFinalPayments(e.target.checked)} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                            <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest group-hover:text-[var(--beheer-text)] transition-colors">Restbetalingen Aan</span>
                    </label>

                    <label className="relative flex items-center gap-4 bg-[var(--beheer-card-soft)]/30 p-3 rounded-xl border border-[var(--beheer-border)]/30 cursor-pointer group transition-all hover:bg-[var(--beheer-card-soft)]/50">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" name="is_bus_trip" checked={isBusTrip} onChange={(e) => setIsBusTrip(e.target.checked)} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                            <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest group-hover:text-[var(--beheer-text)] transition-colors">Busreis (Rijbewijs)</span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button 
                    type="submit" 
                    disabled={pending} 
                    className="w-full bg-[var(--beheer-accent)] text-white px-8 py-4 rounded-xl font-semibold tracking-widest text-[10px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group border border-white/10"
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                    <span>{pending ? 'Bezig...' : isAdding ? 'Reis Aanmaken' : 'Wijzigingen Opslaan'}</span>
                </button>
                
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="w-full px-8 py-4 rounded-xl font-semibold tracking-widest text-[10px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                >
                    Annuleren
                </button>
            </div>
        </div>
    );
}
