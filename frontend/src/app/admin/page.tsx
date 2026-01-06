'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import { stickersApi } from '@/shared/lib/api/salvemundi';
import { 
    Users, 
    Calendar, 
    Award, 
    Cake, 
    TrendingUp,
    UserCheck,
    Plus,
    FileText
} from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

interface DashboardStats {
    totalSignups: number;
    upcomingBirthdays: Array<{ id: string; first_name: string; last_name: string; birthday: string }>;
    topStickers: Array<{ id: string; first_name: string; last_name: string; count: number }>;
    totalCommitteeMembers: number;
    upcomingEvents: number;
    totalEvents: number;
}

function StatCard({ 
    title, 
    value, 
    icon, 
    subtitle,
    onClick 
}: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode;
    subtitle?: string;
    onClick?: () => void;
}) {
    const Component = onClick ? 'button' : 'div';
    return (
        <Component
            onClick={onClick}
            className={`bg-white rounded-2xl shadow-lg p-6 ${onClick ? 'hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1' : ''}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold text-theme-purple">{value}</p>
                    {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
                </div>
                <div className="bg-theme-purple/10 p-3 rounded-xl text-theme-purple">
                    {icon}
                </div>
            </div>
        </Component>
    );
}

function ListCard({ 
    title, 
    icon, 
    children 
}: { 
    title: string; 
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-theme-purple/10 p-2 rounded-xl text-theme-purple">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalSignups: 0,
        upcomingBirthdays: [],
        topStickers: [],
        totalCommitteeMembers: 0,
        upcomingEvents: 0,
        totalEvents: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch all stats in parallel
            const [
                signupsData,
                usersData,
                stickersData,
                committeeMembersData,
                eventsData
            ] = await Promise.all([
                // Total event signups
                directusFetch<any>('/items/event_signups?aggregate[count]=*'),
                // Users with birthdays in next 7 days
                fetchUpcomingBirthdays(),
                // Top sticker collectors
                fetchTopStickerCollectors(),
                // Total committee members
                directusFetch<any>('/items/committee_members?aggregate[count]=*'),
                // Events (all and upcoming)
                fetchEventsStats()
            ]);

            setStats({
                totalSignups: signupsData?.[0]?.count || 0,
                upcomingBirthdays: usersData || [],
                topStickers: stickersData || [],
                totalCommitteeMembers: committeeMembersData?.[0]?.count || 0,
                upcomingEvents: eventsData.upcoming,
                totalEvents: eventsData.total,
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUpcomingBirthdays = async () => {
        try {
            // Fetch all users with birthdays
            const users = await directusFetch<any[]>('/users?fields=id,first_name,last_name,date_of_birth&filter[date_of_birth][_nnull]=true');
            
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);

            const upcoming = users.filter(user => {
                if (!user.date_of_birth) return false;
                
                const birthday = new Date(user.date_of_birth);
                const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
                
                return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
            }).map(user => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                birthday: user.date_of_birth
            }));

            return upcoming.slice(0, 5); // Top 5
        } catch (error) {
            console.error('Failed to fetch birthdays:', error);
            return [];
        }
    };

    const fetchTopStickerCollectors = async () => {
        try {
            // Use the centralized stickers API (same as stickers page) to respect permissions/fields
            const stickers = await stickersApi.getAll();

            const counts: Record<string, { id: string; first_name: string; last_name: string; count: number }> = {};

            stickers.forEach((sticker: any) => {
                const user = sticker.user_created || sticker.user_created;
                if (user && typeof user === 'object' && user.id) {
                    const userId = user.id;
                    if (!counts[userId]) {
                        counts[userId] = {
                            id: userId,
                            first_name: user.first_name || 'Onbekend',
                            last_name: user.last_name || '',
                            count: 0
                        };
                    }
                    counts[userId].count++;
                }
            });

            const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
            return sorted.slice(0, 3); // Top 3
        } catch (error) {
            console.error('Failed to fetch sticker stats:', error);
            return [];
        }
    };

    const fetchEventsStats = async () => {
        try {
            const allEvents = await directusFetch<any[]>('/items/events?fields=id,event_date&limit=-1');
            const now = new Date();
            
            const upcoming = allEvents.filter(event => new Date(event.event_date) >= now);
            
            return {
                total: allEvents.length,
                upcoming: upcoming.length
            };
        } catch (error) {
            console.error('Failed to fetch events stats:', error);
            return { total: 0, upcoming: 0 };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
    };

    if (isLoading) {
        return (
            <>
                <PageHeader
                    title="Admin Dashboard"
                    description="Beheer en statistieken"
                />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Admin Dashboard"
                description={`Welkom ${user?.first_name || 'Admin'}`}
            />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Quick Actions */}
                <div className="mb-8 flex gap-4 flex-wrap">
                    <button
                        onClick={() => router.push('/admin/activiteiten/nieuw')}
                        className="bg-theme-purple text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Nieuwe Activiteit
                    </button>
                    <button
                        onClick={() => router.push('/admin/activiteiten')}
                        className="bg-white text-theme-purple px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <FileText className="h-5 w-5" />
                        Beheer Activiteiten
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Totaal Inschrijvingen"
                        value={stats.totalSignups}
                        icon={<UserCheck className="h-6 w-6" />}
                        subtitle="Alle activiteiten"
                    />
                    <StatCard
                        title="Aankomende Events"
                        value={stats.upcomingEvents}
                        icon={<Calendar className="h-6 w-6" />}
                        subtitle={`Van ${stats.totalEvents} totaal`}
                        onClick={() => router.push('/admin/activiteiten')}
                    />
                    <StatCard
                        title="Commissieleden"
                        value={stats.totalCommitteeMembers}
                        icon={<Users className="h-6 w-6" />}
                        subtitle="Actieve leden"
                    />
                    <StatCard
                        title="Jarigen Komende Week"
                        value={stats.upcomingBirthdays.length}
                        icon={<Cake className="h-6 w-6" />}
                        subtitle="Vergeet niet te feliciteren!"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Birthdays */}
                    <ListCard
                        title="Aankomende Jarigen"
                        icon={<Cake className="h-5 w-5" />}
                    >
                        {stats.upcomingBirthdays.length > 0 ? (
                            <div className="space-y-3">
                                {stats.upcomingBirthdays.map(person => (
                                    <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {person.first_name} {person.last_name}
                                            </p>
                                            <p className="text-sm text-slate-500">{formatDate(person.birthday)}</p>
                                        </div>
                                        <Cake className="h-5 w-5 text-theme-purple" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">Geen jarigen deze week</p>
                        )}
                    </ListCard>

                    {/* Top Sticker Collectors */}
                    <ListCard
                        title="Top 3 Sticker Verzamelaars"
                        icon={<Award className="h-5 w-5" />}
                    >
                        {stats.topStickers.length > 0 ? (
                            <div className="space-y-3">
                                {stats.topStickers.map((person, index) => (
                                    <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                                index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-slate-400' :
                                                'bg-orange-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {person.first_name} {person.last_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-theme-purple">{person.count}</span>
                                            <Award className="h-5 w-5 text-theme-purple" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">Geen stickers gevonden</p>
                        )}
                    </ListCard>
                </div>

                {/* Additional Info removed */}
            </div>
        </>
    );
}
