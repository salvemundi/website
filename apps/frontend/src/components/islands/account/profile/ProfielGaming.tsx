'use client';

import React from 'react';
import { Gamepad2, Pen, Save, Loader2 } from 'lucide-react';
import { Tile, formatForBreak } from './ProfielUI';

import { UseFormRegister, UseFormHandleSubmit, FieldErrors } from 'react-hook-form';

interface ProfielGamingProps {
    user?: {
        minecraft_username?: string | null;
    };
    isEditingMinecraft?: boolean;
    setIsEditingMinecraft?: (val: boolean) => void;
    registerMinecraft?: UseFormRegister<{ minecraft_username?: string | null }>;
    handleSubmitMinecraft?: UseFormHandleSubmit<{ minecraft_username?: string | null }>;
    onSaveMinecraft?: (data: { minecraft_username?: string | null }) => void;
    resetMinecraft?: (data: { minecraft_username?: string | null }) => void;
    minecraftErrors?: FieldErrors<{ minecraft_username?: string | null }>;
    isPending?: boolean;
}

export default function ProfielGaming({
    user = {},
    isEditingMinecraft = false,
    setIsEditingMinecraft = () => { },
    registerMinecraft = (() => ({ name: 'minecraft_username', onBlur: async () => { }, onChange: async () => { }, ref: () => { } })) as unknown as UseFormRegister<{ minecraft_username?: string | null }>,
    handleSubmitMinecraft = (() => () => { }) as unknown as UseFormHandleSubmit<{ minecraft_username?: string | null }>,
    onSaveMinecraft = () => { },
    resetMinecraft: _resetMinecraft = () => { },
    minecraftErrors: _minecraftErrors = {},
    isPending = false
}: ProfielGamingProps) {
    return (
        <Tile title="Social Gaming" icon={<Gamepad2 className="h-5 w-5" />} className="h-fit">
            <div className="flex flex-col gap-1.5 relative group">
                <div className="flex items-center justify-between gap-2 h-6 pl-1">
                    <p className="text-[11px] font-black uppercase text-licht-paars dark:text-geel tracking-wider text-left">
                        Minecraft Username
                    </p>
                    {!isEditingMinecraft && (
                        <button onClick={() => setIsEditingMinecraft(true)} className="icon-button text-text-muted hover:text-purple-500 p-1 rounded-md transition-colors">
                            <Pen className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 squircle bg-licht-paars/10 dark:bg-white/5 p-5 border border-licht-paars/20 dark:border-white/10 shadow-sm min-h-17">
                    <Gamepad2 className="h-5 w-5 text-purple-300 dark:text-licht-paars" />
                    {isEditingMinecraft ? (
                        <form onSubmit={(e) => { void handleSubmitMinecraft(onSaveMinecraft)(e); }} className="flex flex-col w-full gap-2" autoComplete="off">                            <div className="flex w-full items-center gap-2">
                            <input
                                {...registerMinecraft("minecraft_username")}
                                type="text"
                                className="form-input flex-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                placeholder="Username"
                                autoComplete="off"
                            />
                            <button type="submit" disabled={isPending} className="form-button p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </button>
                        </div>
                        </form>
                    ) : (
                        <p className="wrap-break-word font-bold text-purple-700 dark:text-white text-sm min-w-0 flex-1">
                            {formatForBreak(user.minecraft_username) || "Niet ingesteld"}
                        </p>
                    )}
                </div>
            </div>
        </Tile>
    );
}
