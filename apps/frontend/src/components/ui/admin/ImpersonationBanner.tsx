'use client';

import { useTransition } from 'react';
import { Shield, X, User } from 'lucide-react';
import { clearImpersonateToken } from '@/server/actions/admin/admin-impersonation.actions';

interface Props {
    targetName: string;
    adminName: string;
    committees: string[];
}

export default function ImpersonationBanner({ targetName, adminName, committees }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleStop = () => {
        startTransition(async () => {
            await clearImpersonateToken();
            window.location.reload();
        });
    };

    return (
        <div className="animate-in slide-in-from-top fixed inset-x-0 top-0 z-9999 duration-500">
            <div className="border-b border-white/20 bg-linear-to-r from-orange-600 to-amber-600 px-4 py-2 text-white shadow-xl">
                <div className="mx-auto flex max-w-360 items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 rounded-lg bg-white/20 p-1.5">
                            <Shield className="size-4" />
                        </div>
                        <div className="flex items-center gap-2 truncate text-base font-medium">
                            <span className="hidden opacity-80 sm:inline">Test Modus Actief:</span>
                            <span className="flex items-center gap-1.5 rounded-md bg-black/30 px-2 py-0.5 font-bold">
                                <User className="size-3" />
                                {targetName}
                            </span>
                            <span className="hidden text-base italic opacity-60 lg:inline">
                                (Geïmiteerd door {adminName})
                            </span>
                            {committees.length > 0 && (
                                <span className="hidden opacity-60 md:inline">– ({committees.join(', ')})</span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleStop}
                        disabled={isPending}
                        className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-base font-bold text-orange-700 transition-all hover:scale-105 hover:bg-orange-50 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? 'Bezig...' : (
                            <>
                                <X className="size-3" />
                                <span className="xs:inline hidden">Stop Testen</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Standardize the height variable for other components like Header and AdminToolbar */}
            <style jsx global>{`
                :root {
                    --impersonation-banner-height: 40px;
                }
            `}</style>
        </div>
    );
}
