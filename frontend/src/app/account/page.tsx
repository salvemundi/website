'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { getUserEventSignups, updateMinecraftUsername } from '@/shared/lib/auth';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { format } from 'date-fns';

interface EventSignup {
    id: number;
    created_at: string;
    event_id: {
        id: number;
        name: string;
        event_date: string;
        description: string;
        image?: string;
        contact_phone?: string;
        contact_name?: string;
    };
}

export default function AccountPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth();
    const [eventSignups, setEventSignups] = useState<EventSignup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [minecraftUsername, setMinecraftUsername] = useState('');
    const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
    const [isSavingMinecraft, setIsSavingMinecraft] = useState(false);

    useEffect(() => {
        if (user?.minecraft_username) {
            setMinecraftUsername(user.minecraft_username);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (user?.id) {
            loadEventSignups();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const loadEventSignups = async () => {
        if (!user?.id) return;

        try {
            setIsLoading(true);
            const signups = await getUserEventSignups(user.id);
            setEventSignups(signups);
        } catch (error) {
            console.error('Failed to load event signups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const handleSaveMinecraftUsername = async () => {
        if (!user?.id) return;

        setIsSavingMinecraft(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            await updateMinecraftUsername(user.id, minecraftUsername, token);
            // We need to refresh the user to get the updated minecraft username
            // Since refreshUser is not exposed from useAuth directly in the old code (it was destructured),
            // we might need to import it or use the one from useAuth if available.
            // Checking useAuth hook definition... it seems refreshUser IS exposed in the new AuthProvider.
            // But wait, I imported refreshUser from '@/shared/lib/auth' in the imports above.
            // Let's check if useAuth exposes it. The old code destructured it from useAuth.
            // I will assume useAuth exposes it, or I will use the standalone function if needed.
            // Actually, looking at the old code: `const { ..., refreshUser } = useAuth();`
            // So I should try to get it from useAuth.

            // For now, I'll assume the standalone function works if I pass the token, 
            // but to update the context state, I really should call the context's refresh method.
            // I'll check if I can get it from useAuth.
            await refreshUser();
        } catch (error) {
            console.error('Failed to update minecraft username:', error);
            alert('Kon Minecraft gebruikersnaam niet bijwerken. Probeer het opnieuw.');
        } finally {
            setIsSavingMinecraft(false);
        }
    };

    const getMembershipStatusDisplay = () => {
        if (!user?.membership_status || user.membership_status === 'none') {
            return { text: 'Geen Actief Lidmaatschap', color: 'bg-gray-400', textColor: 'text-theme-white' };
        }
        if (user.membership_status === 'active') {
            return { text: 'Actief Lid', color: 'bg-theme-purple-lighter', textColor: 'text-theme-purple-darker' };
        }
        return { text: 'Lidmaatschap Verlopen', color: 'bg-theme-purple/50', textColor: 'text-theme-purple-darker' };
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="text-theme-purple text-xl font-semibold">Laden...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 ">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Profile Section */}
                    <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl p-6 sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
                                {user.avatar ? (
                                    <img
                                        src={getImageUrl(user.avatar)}
                                        alt={`${user.first_name} ${user.last_name}`}
                                        className="w-24 h-24 rounded-full object-cover  self-center sm:self-auto"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/img/avatar-placeholder.svg';
                                        }}
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-theme-purple-lighter flex items-center justify-center  self-center sm:self-auto">
                                        <span className="text-3xl font-bold text-theme-purple-darker">
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </span>
                                    </div>
                                )}

                                <div className="text-center sm:text-left w-full">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple mb-2">
                                        {user.first_name && user.last_name
                                            ? `${user.first_name} ${user.last_name}`
                                            : user.email || 'User'}
                                    </h1>
                                    {(!user.first_name || !user.last_name) && (
                                        <p className="text-sm text-theme-purple/70 mb-2">
                                            (Naam niet ingesteld)
                                        </p>
                                    )}
                                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                        {user.is_member ? (
                                            <span className="px-3 py-1 bg-theme-purple-lighter text-theme-purple-darker text-sm font-semibold rounded-full">
                                                Fontys Student
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-theme-purple/20 text-theme-purple text-sm font-semibold rounded-full">
                                                Geregistreerde Gebruiker
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 ${getMembershipStatusDisplay().color} ${getMembershipStatusDisplay().textColor} text-sm font-semibold rounded-full`}>
                                            {getMembershipStatusDisplay().text}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                                {/* Admin Panel Button - Only for Microsoft users */}
                                {user.entra_id && (
                                    <a
                                        href="https://admin.salvemundi.nl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-2 bg-theme-purple-lighter text-theme-purple-darker rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md text-center w-full"
                                    >
                                        Admin Panel
                                    </a>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-2 bg-gradient-theme text-theme-white rounded-full font-semibold shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl w-full"
                                >
                                    Uitloggen
                                </button>
                            </div>
                        </div>

                        <div className="pt-6">
                            <h2 className="text-lg font-semibold text-theme-purple mb-4">Account Informatie</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-theme-purple/70 font-semibold">E-mail</p>
                                    <p className="font-medium text-theme-purple">{user.email}</p>
                                </div>

                                {user.fontys_email && (
                                    <div>
                                        <p className="text-sm text-theme-purple/70 font-semibold">Fontys E-mail</p>
                                        <p className="font-medium text-theme-purple">{user.fontys_email}</p>
                                    </div>
                                )}

                                {user.phone_number && (
                                    <div>
                                        <p className="text-sm text-theme-purple/70 font-semibold">Telefoonnummer</p>
                                        <p className="font-medium text-theme-purple">{user.phone_number}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-theme-purple/70 font-semibold mb-1">Minecraft Gebruikersnaam</p>
                                    {isEditingMinecraft ? (
                                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                            <input
                                                type="text"
                                                value={minecraftUsername}
                                                onChange={(e) => setMinecraftUsername(e.target.value)}
                                                className="flex-1 px-3 py-1 text-sm  rounded-lg focus:outline-none"
                                                placeholder="Minecraft gebruikersnaam"
                                            />
                                            <button
                                                onClick={handleSaveMinecraftUsername}
                                                disabled={isSavingMinecraft}
                                                className="px-3 py-1 text-sm bg-theme-purple-lighter text-theme-purple-darker rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50"
                                            >
                                                {isSavingMinecraft ? '...' : '✓'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingMinecraft(false);
                                                    setMinecraftUsername(user.minecraft_username || '');
                                                }}
                                                className="px-3 py-1 text-sm bg-gray-200 text-theme-purple rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                            <p className="font-medium text-theme-purple text-sm flex-1">
                                                {user.minecraft_username || 'Niet ingesteld'}
                                            </p>
                                            <button
                                                onClick={() => setIsEditingMinecraft(true)}
                                                className="px-3 py-1 text-xs bg-theme-purple/20 text-theme-purple rounded-lg font-semibold hover:bg-theme-purple/30 transition-all"
                                            >
                                                {user.minecraft_username ? 'Bewerken' : 'Toevoegen'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {user.membership_expiry && (
                                    <div>
                                        <p className="text-sm text-theme-purple/70 font-semibold">Lidmaatschap Geldig Tot</p>
                                        <p className="font-medium text-theme-purple">
                                            {format(new Date(user.membership_expiry), 'd MMMM yyyy')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Links Section */}
                        <div className="20 pt-6 mt-6">
                            <h2 className="text-lg font-semibold text-theme-purple mb-4">Snelle Links</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                <button
                                    onClick={() => router.push('/account/transacties')}
                                    className="p-4 rounded-xl hover:bg-theme-purple/10 transition-all text-left w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">💳</span>
                                        <div>
                                            <h3 className="font-semibold text-theme-purple">Transacties</h3>
                                            <p className="text-sm text-theme-purple/70">Bekijk je betalingsgeschiedenis</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => router.push('/account/whatsapp-groepen')}
                                    className="p-4  rounded-xl hover:bg-theme-purple/10 transition-all text-left relative w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">💬</span>
                                        <div>
                                            <h3 className="font-semibold text-theme-purple flex items-center gap-2">
                                                WhatsApp Groepen
                                                {user.membership_status !== 'active' && (
                                                    <span className="text-xs px-2 py-0.5 bg-theme-purple/20 rounded-full">🔒</span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-theme-purple/70">
                                                {user.membership_status === 'active' ? 'Word lid van groepen' : 'Vereist actief lidmaatschap'}
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <a
                                    href="https://salvemundi.sharepoint.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-4  rounded-xl hover:bg-theme-purple/10 transition-all text-left w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">📁</span>
                                        <div>
                                            <h3 className="font-semibold text-theme-purple">SharePoint</h3>
                                            <p className="text-sm text-theme-purple/70">Open het Salve Mundi archief in een nieuw tabblad</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Event Signups Section */}
                    <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl p-6 sm:p-8 ">
                        <h2 className="text-2xl font-bold text-theme-purple mb-6">Mijn Evenement Inschrijvingen</h2>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="text-theme-purple">Je inschrijvingen worden geladen...</div>
                            </div>
                        ) : eventSignups.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-theme-purple mb-4">Je hebt je nog niet ingeschreven voor evenementen.</div>
                                <button
                                    onClick={() => router.push('/activiteiten')}
                                    className="px-6 py-3 bg-gradient-theme text-theme-white rounded-full font-semibold shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    Bekijk Evenementen
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {eventSignups.map((signup) => (
                                    <div
                                        key={signup.id}
                                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4  rounded-xl transition-all hover:shadow-md"
                                    >
                                        {signup.event_id.image ? (
                                            <img
                                                src={getImageUrl(signup.event_id.image)}
                                                alt={signup.event_id.name}
                                                className="w-24 h-24 rounded-xl object-cover "
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/img/placeholder.svg';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-xl bg-theme-purple-lighter flex items-center justify-center ">
                                                <span className="text-theme-purple-darker text-2xl">📅</span>
                                            </div>
                                        )}

                                        <div className="flex-1 w-full">
                                            <h3 className="text-lg font-semibold text-theme-purple mb-1">
                                                {signup.event_id.name}
                                            </h3>
                                            <p className="text-sm text-theme-purple/70 mb-1">
                                                Evenement Datum: {format(new Date(signup.event_id.event_date), 'd MMMM yyyy')}
                                            </p>
                                            {signup.event_id.contact_name && (
                                                <p className="text-sm text-theme-purple/70 mb-1">
                                                    Contact: {signup.event_id.contact_name}
                                                </p>
                                            )}
                                            <p className="text-xs text-theme-purple/50">
                                                Ingeschreven op: {format(new Date(signup.created_at), 'd MMMM yyyy')}
                                            </p>
                                        </div>

                                        <div className="w-full sm:w-auto">
                                            <button
                                                onClick={() => router.push('/activiteiten')}
                                                className="w-full px-4 py-2 text-theme-purple  rounded-full font-semibold hover:bg-gradient-theme hover:text-theme-white transition-all"
                                            >
                                                Bekijk Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
