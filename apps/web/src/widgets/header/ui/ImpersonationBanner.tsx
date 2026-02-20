import { cookies } from 'next/headers';
import { AUTH_COOKIES } from '@/shared/config/auth-config';
import { clearImpersonationAction } from '@/shared/api/auth-actions';
import { RefreshCcw } from 'lucide-react';
import { redirect } from 'next/navigation';

export async function ImpersonationBanner() {
    const cookieStore = await cookies();
    const testToken = cookieStore.get(AUTH_COOKIES.TEST_TOKEN)?.value;

    if (!testToken) return null;

    async function handleClearIter() {
        'use server';
        await clearImpersonationAction();
        redirect('/');
    }

    return (
        <div className="fixed top-0 left-0 w-full z-[100] bg-orange-500 text-white px-4 py-2 font-bold text-center flex items-center justify-center gap-4 text-sm shadow-md">
            <span>⚠️ Test Modus Actief: Je imiteert momenteel een actieve gebruiker.</span>
            <form action={handleClearIter}>
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 transition-colors px-3 py-1 rounded-full text-xs shadow"
                >
                    <RefreshCcw className="w-3 h-3" />
                    Stop Testen
                </button>
            </form>
        </div>
    );
}
