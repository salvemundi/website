'use client';

import React from 'react';
import Image from 'next/image';

interface AvatarPreviewModalProps {
    preview: string;
    isPending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function AvatarPreviewModal({ 
    preview, 
    isPending, 
    onConfirm, 
    onCancel 
}: AvatarPreviewModalProps) {
    return (
        <div className="animate-in fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-300">
            <div className="squircle-xl animate-in zoom-in-95 flex w-full max-w-sm flex-col items-center border border-white/10 bg-(--bg-card) p-8 text-center shadow-2xl duration-300">
                <h3 className="mb-6 text-2xl font-black text-white">Nieuwe profielfoto</h3>
                
                <div className="relative mb-8 size-48 overflow-hidden rounded-full border-4 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <Image 
                        src={preview} 
                        alt="Preview" 
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>

                <p className="mb-8 leading-relaxed font-medium text-(--text-muted)">
                    Ziet dit er goed uit? Klik op opslaan om je nieuwe foto te gebruiken.
                </p>

                <div className="flex w-full flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="squircle hover:scale-1.02 form-button w-full bg-purple-600 py-4 text-lg font-black text-white shadow-xl shadow-purple-600/20 transition-all hover:bg-purple-500 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? 'Uploaden...' : 'Opslaan'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="squircle form-button w-full border-2 border-white/10 py-4 text-lg font-bold text-white transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </div>
    );
}
