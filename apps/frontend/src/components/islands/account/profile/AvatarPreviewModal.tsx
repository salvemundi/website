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
        <div className="fixed inset-0 isolate z-9999 flex items-center justify-center p-4 sm:p-6">
            <div
                className="modal-backdrop"
                onClick={onCancel}
            />

            <div className="modal-content relative z-10 flex w-full max-w-sm flex-col items-center p-6 text-center">
                <h3 className="mb-6 text-xl font-bold text-(--text-main)">Nieuwe profielfoto</h3>
                
                <div className="relative mb-6 size-48 overflow-hidden rounded-full border-4 border-theme-purple shadow-md">
                    <Image 
                        src={preview} 
                        alt="Preview" 
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>

                <p className="mb-6 text-sm font-medium text-(--text-muted)">
                    Ziet dit er goed uit? Klik op opslaan om je nieuwe foto te gebruiken.
                </p>

                <div className="flex w-full flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="form-button w-full"
                        type="button"
                    >
                        {isPending ? 'Uploaden...' : 'Opslaan'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="btn-secondary w-full"
                        type="button"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </div>
    );
}
