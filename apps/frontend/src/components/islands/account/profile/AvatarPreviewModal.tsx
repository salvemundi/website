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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-(--bg-card) squircle-xl p-8 max-w-sm w-full shadow-2xl border border-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-black text-white mb-6">Nieuwe profielfoto</h3>
                
                <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-8">
                    <Image 
                        src={preview} 
                        alt="Preview" 
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>

                <p className="text-(--text-muted) font-medium mb-8 leading-relaxed">
                    Ziet dit er goed uit? Klik op opslaan om je nieuwe foto te gebruiken.
                </p>

                <div className="flex flex-col w-full gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="form-button w-full py-4 squircle bg-purple-600 text-white font-black text-lg shadow-xl shadow-purple-600/20 transition-all hover:scale-[1.02] hover:bg-purple-500 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? 'Uploaden...' : 'Opslaan'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="form-button w-full py-4 squircle border-2 border-white/10 text-white font-bold text-lg transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </div>
    );
}
