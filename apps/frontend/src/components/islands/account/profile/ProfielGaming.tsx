'use client';

import React from 'react';
import { Gamepad2, Edit2, Save, Loader2, X } from 'lucide-react';
import { Tile, formatForBreak } from './ProfielUI';

interface ProfielGamingProps {
    isLoading?: boolean;
    user?: any;
    isEditingMinecraft?: boolean;
    setIsEditingMinecraft?: (val: boolean) => void;
    registerMinecraft?: any;
    handleSubmitMinecraft?: any;
    onSaveMinecraft?: (data: any) => void;
    resetMinecraft?: (data: any) => void;
    minecraftErrors?: any;
    isPending?: boolean;
}

export default function ProfielGaming({
    isLoading = false,
    user = {},
    isEditingMinecraft = false,
    setIsEditingMinecraft = () => {},
    registerMinecraft,
    handleSubmitMinecraft,
    onSaveMinecraft = () => {},
    resetMinecraft = () => {},
    minecraftErrors = {},
    isPending = false
}: ProfielGamingProps) {
    return (
        <Tile title="Social Gaming" icon={<Gamepad2 className="h-5 w-5" />} className={`h-fit ${isLoading ? 'skeleton-active' : ''}`} aria-busy={isLoading}>
            <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm relative group">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-[11px] font-bold uppercase text-[var(--color-purple-400)] tracking-wide text-left">
                        Minecraft Username
                    </p>
                    {!isEditingMinecraft && !isLoading && (
                        <button onClick={() => setIsEditingMinecraft(true)} className="text-[var(--text-muted)] hover:text-[var(--color-purple-500)] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                    <Gamepad2 className="h-5 w-5 text-[var(--color-purple-300)]" />
                    {isEditingMinecraft ? (
                        <form onSubmit={handleSubmitMinecraft(onSaveMinecraft)} className="flex flex-col w-full gap-2" autoComplete="off">
                            <div className="flex w-full items-center gap-2">
                                <input 
                                    {...registerMinecraft("minecraft_username")}
                                    type="text" 
                                    className={`flex-1 bg-white dark:bg-black/40 border ${minecraftErrors.minecraft_username ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-white/20'} rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-purple-500)] focus:border-transparent outline-none`}
                                    placeholder="Username"
                                    autoComplete="off"
                                />
                                <button type="submit" disabled={isPending} className="p-1.5 bg-[var(--color-purple-500)] text-white rounded-lg hover:bg-[var(--color-purple-600)] transition-colors">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="break-words font-bold text-[var(--color-purple-700)] dark:text-white text-base min-w-0 flex-1">
                            {isLoading ? 'LOADING_USERNAME' : (formatForBreak(user.minecraft_username) || "Niet ingesteld")}
                        </p>
                    )}
                </div>
            </div>
        </Tile>
    );
}

