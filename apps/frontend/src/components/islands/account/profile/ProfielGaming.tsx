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
        <Tile title="Social Gaming" icon={<Gamepad2 className="size-5" />} className="h-fit">
            <div className="group relative flex flex-col gap-1.5">
                <div className="flex h-6 items-center justify-between gap-2 pl-1">
                    <p className="text-left text-[11px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                        Minecraft Username
                    </p>
                    {!isEditingMinecraft && (
                        <button onClick={() => setIsEditingMinecraft(true)} className="icon-button rounded-md p-1 text-text-muted transition-colors hover:text-purple-500">
                            <Pen className="size-3.5" />
                        </button>
                    )}
                </div>
                <div className="squircle flex min-h-17 items-center gap-3 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <Gamepad2 className="size-5 text-purple-300 dark:text-licht-paars" />
                    {isEditingMinecraft ? (
                        <form onSubmit={(e) => { void handleSubmitMinecraft(onSaveMinecraft)(e); }} className="flex w-full flex-col gap-2" autoComplete="off">                            <div className="flex w-full items-center gap-2">
                            <input
                                {...registerMinecraft("minecraft_username")}
                                type="text"
                                className="form-input flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-white/20 dark:bg-black/40"
                                placeholder="Username"
                                autoComplete="off"
                            />
                            <button type="submit" disabled={isPending} className="form-button flex w-fit shrink-0 cursor-pointer items-center justify-center rounded-lg bg-purple-500 px-3 py-1.5 text-white transition-colors hover:bg-purple-600 disabled:opacity-50">
                                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            </button>
                        </div>
                        </form>
                    ) : (
                        <p className="min-w-0 flex-1 text-sm font-bold wrap-break-word text-purple-700 dark:text-white">
                            {formatForBreak(user.minecraft_username) || "Niet ingesteld"}
                        </p>
                    )}
                </div>
            </div>
        </Tile>
    );
}
