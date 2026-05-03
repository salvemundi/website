'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';

export function InputField({ 
    label, 
    name, 
    type = 'text', 
    defaultValue, 
    placeholder, 
    required, 
    step, 
    description 
}: { 
    label: string, 
    name: string, 
    type?: string, 
    defaultValue?: string | number | null, 
    placeholder?: string, 
    required?: boolean, 
    step?: string, 
    description?: string 
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-0.5">
                    {label} {required && <span className="text-[var(--theme-error)]">*</span>}
                </label>
                {description && <span className="text-[9px] text-[var(--text-muted)] opacity-60 ml-0.5 font-medium leading-tight">{description}</span>}
            </div>
            <input 
                type={type} 
                name={name}
                step={step}
                defaultValue={defaultValue ?? undefined}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-sm text-[var(--beheer-text)] transition-all font-semibold focus:ring-2 focus:ring-[var(--beheer-accent)]"
            />
        </div>
    );
}

export function ReisImageUpload({ defaultValue, name }: { defaultValue?: string | null, name: string }) {
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const currentImage = preview || (defaultValue ? getImageUrl(defaultValue, { width: 400, height: 200, fit: 'cover' }) : null);

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-0.5">
                Banner Afbeelding
            </label>
            <div className="relative group overflow-hidden bg-[var(--bg-main)]/50 rounded-xl border-2 border-dashed border-[var(--beheer-border)]/30 hover:border-[var(--beheer-accent)]/50 transition-all aspect-video flex flex-col items-center justify-center p-2 text-center cursor-pointer max-h-[160px]">
                <input 
                    type="file" 
                    name="image_file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                
                {currentImage ? (
                    <div className="absolute inset-0">
                        <img src={currentImage} alt="Preview" className="w-full h-full object-contain transition-opacity group-hover:opacity-40" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="h-6 w-6 text-[var(--beheer-text)] mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Wijzigen</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <ImageIcon className="h-8 w-8 text-[var(--text-muted)] mb-2 opacity-20 group-hover:opacity-40 transition-opacity" />
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Afbeelding hier</p>
                    </>
                )}
                
                {/* Hidden ID field to maintain references if image not changed */}
                <input type="hidden" name={name} value={defaultValue || ''} />
            </div>
        </div>
    );
}

export function ToggleField({ label, name, defaultChecked }: { label: string, name: string, defaultChecked?: boolean }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-xs font-bold text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors">{label}</span>
            <div className="relative">
                <input 
                    type="checkbox" 
                    name={name} 
                    defaultChecked={defaultChecked}
                    className="sr-only peer"
                />
                <div className="w-12 h-6 bg-[var(--beheer-border)]/20 rounded-full peer peer-checked:bg-[var(--beheer-accent)] transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-[var(--beheer-card-bg)] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 shadow-inner ring-1 ring-[var(--beheer-border)]/30"></div>
            </div>
        </label>
    );
}
