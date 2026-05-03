'use client';

import { useTransition } from 'react';
import { Shield, X, User, AlertCircle } from 'lucide-react';
import { clearImpersonateToken } from '@/server/actions/admin.actions';

interface Props {
    targetName: string;
    adminName: string;
    committees: string[];
    isNormallyAdmin: boolean;
}

export default function ImpersonationBanner({ targetName, adminName, committees, isNormallyAdmin }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleStop = () => {
        startTransition(async () => {
            await clearImpersonateToken();
        });
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top duration-500">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 shadow-xl border-b border-white/20">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex-shrink-0 bg-white/20 p-1.5 rounded-lg">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 text-base font-medium truncate">
                            <span className="opacity-80 hidden sm:inline">Test Modus Actief:</span>
                            <span className="font-bold flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-md">
                                <User className="w-3 h-3" />
                                {targetName}
                            </span>
                            <span className="hidden lg:inline opacity-60 text-base italic">
                                (Geïmiteerd door {adminName})
                            </span>
                            {committees.length > 0 && (
                                <span className="opacity-60 hidden md:inline">— ({committees.join(', ')})</span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleStop}
                        disabled={isPending}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-white text-orange-700 px-3 py-1 rounded-full text-base font-bold hover:bg-orange-50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? 'Bezig...' : (
                            <>
                                <X className="w-3 h-3" />
                                <span className="hidden xs:inline">Stop Testen</span>
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
