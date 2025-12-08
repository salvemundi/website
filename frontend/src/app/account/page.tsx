'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { getUserEventSignups, updateMinecraftUsername } from '@/shared/lib/auth';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { format } from 'date-fns';
import {
    LogOut,
    CreditCard,
    MessageCircle,
    FileText,

    Mail,
    Phone,
    Gamepad2,
    Calendar,
    Shield,
    ExternalLink,
    ChevronRight,
    Lock
} from 'lucide-react';

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
            await refreshUser();
            setIsEditingMinecraft(false);
        } catch (error) {
            console.error('Failed to update minecraft username:', error);
            alert('Kon Minecraft gebruikersnaam niet bijwerken. Probeer het opnieuw.');
        } finally {
            setIsSavingMinecraft(false);
        }
    };

    const getMembershipStatusDisplay = () => {
        if (!user?.membership_status || user.membership_status === 'none') {
            return { text: 'Geen Actief Lidmaatschap', color: 'bg-gray-400', textColor: 'text-white' };
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

    const membershipStatus = getMembershipStatusDisplay();

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">

                <h1 className="text-3xl font-bold text-theme-purple mb-8">Mijn Account</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">

                    {/* Profile Tile - Large */}
                    <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                        <div className="relative">
                            {user.avatar ? (
                                <img
                                    src={getImageUrl(user.avatar)}
                                    alt={`${user.first_name} ${user.last_name}`}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20 shadow-xl"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/img/avatar-placeholder.svg';
                                    }}
                                />
                            ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-theme-purple-lighter flex items-center justify-center border-4 border-white/20 shadow-xl">
                                    <span className="text-3xl sm:text-4xl font-bold text-theme-purple-darker">
                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center sm:text-left z-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-theme-purple mb-2">
                                {user.first_name && user.last_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email || 'User'}
                            </h2>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                                {user.is_member ? (
                                    <span className="px-3 py-1 bg-theme-purple-lighter text-theme-purple-darker text-xs font-bold uppercase tracking-wider rounded-full">
                                        Fontys Student
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-theme-purple/10 text-theme-purple text-xs font-bold uppercase tracking-wider rounded-full">
                                        Geregistreerde Gebruiker
                                    </span>
                                )}
                                <span className={`px-3 py-1 ${membershipStatus.color} ${membershipStatus.textColor} text-xs font-bold uppercase tracking-wider rounded-full`}>
                                    {membershipStatus.text}
                                </span>
                            </div>

                            {/* Membership expiry date */}
                            <div className="text-sm text-theme-purple/70 mt-1">
                                <p className="text-xs text-theme-purple/60 font-bold uppercase">Lidmaatschap eindigt</p>
                                <p className="font-medium">
                                    {user.membership_expiry
                                        ? format(new Date(user.membership_expiry), 'd MMMM yyyy')
                                        : 'Niet van toepassing'}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                {user.entra_id && (
                                    <a
                                        href="https://admin.salvemundi.nl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-theme-purple font-semibold rounded-xl transition-all text-sm"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Admin
                                    </a>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold rounded-xl transition-all text-sm"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Uitloggen
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Tile */}
                    <div className="md:col-span-1 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-theme-purple/10 rounded-lg text-theme-purple">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-theme-purple/60 font-bold uppercase">E-mailadres</p>
                                <p className="text-theme-purple font-medium truncate" title={user.email}>{user.email}</p>
                            </div>
                        </div>

                        {user.fontys_email && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-theme-purple/10 rounded-lg text-theme-purple">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs text-theme-purple/60 font-bold uppercase">Fontys E-mail</p>
                                    <p className="text-theme-purple font-medium truncate" title={user.fontys_email}>{user.fontys_email}</p>
                                </div>
                            </div>
                        )}

                        {user.phone_number && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-theme-purple/10 rounded-lg text-theme-purple">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-theme-purple/60 font-bold uppercase">Telefoonnummer</p>
                                    <p className="text-theme-purple font-medium">{user.phone_number}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Minecraft Tile */}
                    <div className="md:col-span-1 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Gamepad2 className="w-6 h-6 text-theme-purple" />
                            <h3 className="text-lg font-bold text-theme-purple">Minecraft</h3>
                        </div>

                        <div className="bg-white/40 rounded-xl p-4">
                            <p className="text-xs text-theme-purple/60 font-bold uppercase mb-2">Gebruikersnaam</p>
                            {isEditingMinecraft ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={minecraftUsername}
                                        onChange={(e) => setMinecraftUsername(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/80 border-0 focus:ring-2 focus:ring-theme-purple outline-none text-theme-purple"
                                        placeholder="Username"
                                    />
                                    <button
                                        onClick={handleSaveMinecraftUsername}
                                        disabled={isSavingMinecraft}
                                        className="p-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition-colors disabled:opacity-50"
                                    >
                                        {isSavingMinecraft ? '...' : '✓'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className="text-theme-purple font-medium">
                                        {user.minecraft_username || 'Niet ingesteld'}
                                    </span>
                                    <button
                                        onClick={() => setIsEditingMinecraft(true)}
                                        className="text-xs px-3 py-1 bg-theme-purple/10 hover:bg-theme-purple/20 text-theme-purple rounded-lg font-semibold transition-colors"
                                    >
                                        {user.minecraft_username ? 'Wijzig' : 'Instellen'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links Tile */}
                    <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-theme-purple mb-4">Snelle Links</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => router.push('/account/transacties')}
                                className="group flex flex-col items-center justify-center p-4 bg-white/40 hover:bg-white/60 rounded-xl transition-all text-center gap-2"
                            >
                                <div className="p-3 bg-theme-purple/10 rounded-full text-theme-purple group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-theme-purple text-sm">Transacties</span>
                            </button>

                            <button
                                onClick={() => router.push('/account/whatsapp-groepen')}
                                className="group flex flex-col items-center justify-center p-4 bg-white/40 hover:bg-white/60 rounded-xl transition-all text-center gap-2 relative"
                            >
                                <div className="p-3 bg-theme-purple/10 rounded-full text-theme-purple group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-theme-purple text-sm flex items-center gap-1">
                                    WhatsApp
                                    {user.membership_status !== 'active' && <Lock className="w-3 h-3 text-theme-purple/50" />}
                                </span>
                            </button>

                            <a
                                href="https://salvemundi.sharepoint.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center justify-center p-4 bg-white/40 hover:bg-white/60 rounded-xl transition-all text-center gap-2"
                            >
                                <div className="p-3 bg-theme-purple/10 rounded-full text-theme-purple group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-theme-purple text-sm flex items-center gap-1">
                                    SharePoint
                                    <ExternalLink className="w-3 h-3 text-theme-purple/50" />
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Event Signups Tile - Full Width */}
                    <div className="md:col-span-3 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 sm:p-8 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-theme-purple/10 rounded-xl text-theme-purple">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-theme-purple">Mijn Inschrijvingen</h2>
                            </div>
                            <button
                                onClick={() => router.push('/activiteiten')}
                                className="text-sm font-semibold text-theme-purple hover:text-theme-purple-dark transition-colors flex items-center gap-1"
                            >
                                Bekijk agenda <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-theme-purple/20 border-t-theme-purple rounded-full mx-auto mb-4" />
                                <div className="text-theme-purple/60">Inschrijvingen laden...</div>
                            </div>
                        ) : eventSignups.length === 0 ? (
                            <div className="text-center py-12 bg-white/30 rounded-2xl border-2 border-dashed border-theme-purple/10">
                                <p className="text-theme-purple font-medium mb-2">Je hebt je nog niet ingeschreven voor evenementen.</p>
                                <button
                                    onClick={() => router.push('/activiteiten')}
                                    className="px-6 py-2 bg-theme-purple text-white rounded-full font-semibold shadow-lg shadow-theme-purple/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl text-sm"
                                >
                                    Naar evenementen
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {eventSignups.map((signup) => (
                                    <div
                                        key={signup.id}
                                        onClick={() => router.push('/activiteiten')}
                                        className="group flex gap-4 p-4 bg-white/40 hover:bg-white/60 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-theme-purple/10"
                                    >
                                        <div className="shrink-0">
                                            {signup.event_id.image ? (
                                                <img
                                                    src={getImageUrl(signup.event_id.image)}
                                                    alt={signup.event_id.name}
                                                    className="w-20 h-20 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/img/placeholder.svg';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl bg-theme-purple/10 flex items-center justify-center text-theme-purple group-hover:scale-105 transition-transform duration-300">
                                                    <Calendar className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-theme-purple truncate group-hover:text-theme-purple-dark transition-colors">
                                                {signup.event_id.name}
                                            </h3>
                                            <div className="space-y-1 mt-1">
                                                <p className="text-sm text-theme-purple/70 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(signup.event_id.event_date), 'd MMMM yyyy')}
                                                </p>
                                                <p className="text-xs text-theme-purple/50">
                                                    Ingeschreven op: {format(new Date(signup.created_at), 'd MMM yyyy')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center text-theme-purple/30 group-hover:translate-x-1 transition-transform">
                                            <ChevronRight className="w-5 h-5" />
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
