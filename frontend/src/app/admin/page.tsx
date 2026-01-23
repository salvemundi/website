'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { isUserAuthorizedForReis } from '@/shared/lib/committee-utils';
import { directusFetch } from '@/shared/lib/directus';
import { stickersApi, eventsApi } from '@/shared/lib/api/salvemundi';
import {
    Users,
    Calendar,
    Award,
    Cake,
    TrendingUp,
    UserCheck,
    Plus,
    FileText,
    Sticker,
    Mail,
    Heart,
    AlertCircle,
    Activity,
    Ticket,
    Shield
} from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
    return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

interface DashboardStats {
    totalSignups: number;
    upcomingBirthdays: Array<{ id: string; first_name: string; last_name: string; birthday: string }>;
    topStickers: Array<{ id: string; first_name: string; last_name: string; count: number }>;
    totalCommitteeMembers: number;
    upcomingEvents: number;
    totalEvents: number;
    totalStickers: number;
    stickerGrowthRate: number;
    introSignups: number;
    introBlogLikes: number;
    systemErrors: number;
    mostLikedPost?: { id: string; title: string; likes: number; slug: string };
    upcomingEventsWithSignups: Array<{ id: string; name: string; event_date: string; signups: number }>;
    topCommittee?: { name: string; count: number };
    totalCoupons: number;
    pubCrawlSignups: number;
    upcomingPubCrawl?: { id: number; name: string; date: string };
    pubCrawlTickets?: number;
    pubCrawlGroups?: number;
}

function StatCard({
    title,
    value,
    icon,
    subtitle,
    onClick,
    colorClass = 'purple'
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    onClick?: () => void;
    colorClass?: 'purple' | 'orange' | 'blue' | 'green' | 'red';
}) {
    const Component = onClick ? 'button' : 'div';

    const colorStyles = {
        purple: {
            gradient: 'from-purple-500 to-purple-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-purple-100'
        },
        orange: {
            gradient: 'from-orange-500 to-orange-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-orange-100'
        },
        blue: {
            gradient: 'from-blue-500 to-blue-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-blue-100'
        },
        green: {
            gradient: 'from-green-500 to-green-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-green-100'
        },
        red: {
            gradient: 'from-red-500 to-red-600',
            iconBg: 'bg-white/20',
            text: 'text-white',
            subtitleText: 'text-red-100'
        }
    };

    const colors = colorStyles[colorClass];

    return (
        <Component
            onClick={onClick}
            className={`w-full bg-gradient-to-br ${colors.gradient} rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden ${onClick ? 'hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1 hover:scale-[1.02]' : ''}`}
        >
            <div className="absolute top-0 right-0 w-28 h-28 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />
            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
                    <div className="flex-1 text-center sm:text-left sm:pr-2">
                        <p className={`${colors.subtitleText} text-sm font-medium mb-2`}>{title}</p>
                        <p className={`${typeof value === 'string' && value.length > 10 ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold ${colors.text} mb-1 break-words`}>{value}</p>
                        {subtitle && <p className={`${colors.subtitleText} text-xs line-clamp-2`} title={subtitle}>{subtitle}</p>}
                    </div>
                    <div className={`hidden sm:block ${colors.iconBg} p-3 rounded-xl ${colors.text} backdrop-blur-sm flex-shrink-0`}>
                        {icon}
                    </div>
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
        <div className="bg-admin-card rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-admin-card-soft p-2 rounded-xl text-theme-purple">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-admin">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const canManageReis = isUserAuthorizedForReis(user);
    const [stats, setStats] = useState<DashboardStats>({
        totalSignups: 0,
        upcomingBirthdays: [],
        topStickers: [],
        totalCommitteeMembers: 0,
        upcomingEvents: 0,
        totalEvents: 0,
        totalStickers: 0,
        stickerGrowthRate: 0,
        introSignups: 0,
        introBlogLikes: 0,
        systemErrors: 0,
        mostLikedPost: undefined,
        upcomingEventsWithSignups: [],
        topCommittee: undefined,
        totalCoupons: 0,
        pubCrawlSignups: 0,
        upcomingPubCrawl: undefined,
        pubCrawlTickets: 0,
        pubCrawlGroups: 0,
    });
    const [isIctMember, setIsIctMember] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        checkIctMembership();
    }, []);

    const checkIctMembership = async () => {
        if (!user?.id) return;
        try {
            // Check if user is member of ICT committee (committee with name 'ICT' or 'ict')
            const committees = await directusFetch<any[]>('/items/committee_members?fields=committee_id.name&filter[user_id][_eq]=' + user.id);
            const isIct = committees.some(cm => cm.committee_id?.name?.toLowerCase() === 'ict');
            setIsIctMember(isIct);
        } catch (error) {
            console.error('Failed to check ICT membership:', error);
        }
    };

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch all stats in parallel
            const [
                signupsData,
                usersData,
                stickersData,
                committeeMembersCount,
                eventsData,
                stickerStats,
                introStats,
                systemHealth,
                upcomingEventsDetail,
                topCommittee,
                couponsData,
                pubCrawlStats
            ] = await Promise.all([
                // Total event signups
                directusFetch<any>('/items/event_signups?aggregate[count]=*'),
                // Users with birthdays in next 7 days
                fetchUpcomingBirthdays(),
                // Top sticker collectors
                fetchTopStickerCollectors(),
                // Total committee members from visible committees only
                fetchVisibleCommitteeMembersCount(),
                // Events (all and upcoming)
                fetchEventsStats(),
                // Sticker stats (total + growth)
                fetchStickerStats(),
                // Intro newsletter/blog stats
                fetchIntroStats(),
                // System health
                fetchSystemHealth(),
                // Upcoming events with signup counts
                fetchUpcomingEventsWithSignups(),
                // Top committee by activities this year
                fetchTopCommitteeByActivities(),
                // Total active coupons
                directusFetch<any>('/items/coupons?aggregate[count]=*&filter[is_active][_eq]=true').catch(() => [{ count: 0 }]),
                // Pub crawl stats
                fetchPubCrawlStats()
            ]);

            setStats({
                totalSignups: signupsData?.[0]?.count || 0,
                upcomingBirthdays: usersData || [],
                topStickers: stickersData || [],
                totalCommitteeMembers: committeeMembersCount,
                upcomingEvents: eventsData.upcoming,
                totalEvents: eventsData.total,
                totalStickers: stickerStats.total,
                stickerGrowthRate: stickerStats.growthRate,
                introSignups: introStats.signups,
                introBlogLikes: introStats.blogLikes,
                systemErrors: systemHealth.errors,
                mostLikedPost: introStats.mostLikedPost,
                upcomingEventsWithSignups: upcomingEventsDetail,
                topCommittee: topCommittee,
                totalCoupons: couponsData?.[0]?.count || 0,
                pubCrawlSignups: pubCrawlStats.signups,
                upcomingPubCrawl: pubCrawlStats.upcomingEvent,
                pubCrawlTickets: pubCrawlStats.totalTickets || 0,
                pubCrawlGroups: pubCrawlStats.groups || 0,
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

    const fetchVisibleCommitteeMembersCount = async () => {
        try {
            // Get only visible committees
            const committees = await directusFetch<any[]>(
                '/items/committees?fields=id&filter[is_visible][_eq]=true'
            );

            if (committees.length === 0) {
                return 0;
            }

            // Get all committee members for visible committees
            const committeeIds = committees.map(c => c.id);
            // Fetch user ids for members and deduplicate so a user in multiple committees is counted once
            const members = await directusFetch<any[]>(
                `/items/committee_members?fields=user_id.id,user_id&filter[committee_id][_in]=${committeeIds.join(',')}&limit=-1`
            );

            const userIds = members
                .map(m => {
                    // directus may return expanded user object or just the id
                    if (!m) return null;
                    if (m.user_id && typeof m.user_id === 'object' && m.user_id.id) return m.user_id.id;
                    if (m.user_id) return m.user_id;
                    return null;
                })
                .filter(Boolean as any);

            const unique = new Set(userIds);
            return unique.size;
        } catch (error) {
            console.error('Failed to fetch visible committee members count:', error);
            return 0;
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

    const fetchStickerStats = async () => {
        try {
            const allStickers = await stickersApi.getAll();
            const now = new Date();
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const recentStickers = allStickers.filter((s: any) =>
                s.date_created && new Date(s.date_created) >= lastWeek
            );

            const growthRate = allStickers.length > 0
                ? Math.round((recentStickers.length / allStickers.length) * 100)
                : 0;

            return {
                total: allStickers.length,
                growthRate
            };
        } catch (error) {
            console.error('Failed to fetch sticker stats:', error);
            return { total: 0, growthRate: 0 };
        }
    };

    const fetchIntroStats = async () => {
        try {
            const [signupsData, blogsData] = await Promise.all([
                directusFetch<any>('/items/intro_signups?aggregate[count]=*').catch(() => [{ count: 0 }]),
                directusFetch<any[]>('/items/intro_blogs?fields=id,title,slug,likes&filter[is_published][_eq]=true').catch(() => [])
            ]);

            // Ensure likes are parsed as numbers to avoid string concatenation
            const totalLikes = blogsData.reduce((sum: number, blog: any) => {
                const likes = typeof blog.likes === 'string' ? parseInt(blog.likes, 10) : (blog.likes || 0);
                return sum + (isNaN(likes) ? 0 : likes);
            }, 0);

            const mostLiked = blogsData.length > 0
                ? blogsData.reduce((max: any, blog: any) => {
                    const blogLikes = typeof blog.likes === 'string' ? parseInt(blog.likes, 10) : (blog.likes || 0);
                    const maxLikes = typeof max.likes === 'string' ? parseInt(max.likes, 10) : (max.likes || 0);
                    return (isNaN(blogLikes) ? 0 : blogLikes) > (isNaN(maxLikes) ? 0 : maxLikes) ? blog : max;
                })
                : undefined;

            return {
                signups: signupsData?.[0]?.count || 0,
                blogLikes: totalLikes,
                mostLikedPost: mostLiked ? {
                    id: mostLiked.id,
                    title: mostLiked.title,
                    likes: typeof mostLiked.likes === 'string' ? parseInt(mostLiked.likes, 10) : (mostLiked.likes || 0),
                    slug: mostLiked.slug
                } : undefined
            };
        } catch (error) {
            console.error('Failed to fetch intro stats:', error);
            return { signups: 0, blogLikes: 0, mostLikedPost: undefined };
        }
    };

    const fetchSystemHealth = async () => {
        try {
            // Simple health check: count recent failed API calls or errors
            // For now, return 0 as placeholder (can be extended with error logging)
            return { errors: 0 };
        } catch (error) {
            console.error('Failed to fetch system health:', error);
            return { errors: 0 };
        }
    };

    const fetchTopCommitteeByActivities = async () => {
        try {
            const currentYear = new Date().getFullYear();

            // Use eventsApi to respect permissions
            const allEvents = await eventsApi.getAll();

            // Filter events from this year - also include events without start_date
            const eventsThisYear = allEvents.filter((event: any) => {
                if (!event.start_date) {
                    return true; // Include events without date
                }
                const eventDate = new Date(event.start_date);
                const eventYear = eventDate.getFullYear();
                return eventYear === currentYear;
            });

            // Count events per committee
            const committeeCounts: Record<string, { name: string; count: number }> = {};

            // Fetch all committees to map IDs to names
            const committees = await directusFetch<any[]>('/items/committees?fields=id,name');
            const committeeMap = new Map(committees.map(c => [c.id, c.name]));

            eventsThisYear.forEach((event: any) => {
                const committee = event.committee_id;

                // Handle both object and direct ID cases
                if (committee) {
                    let committeeId: string | number;
                    let committeeName: string;

                    if (typeof committee === 'object' && committee.id) {
                        committeeId = committee.id;
                        committeeName = committee.name || committeeMap.get(committeeId) || 'Onbekend';
                    } else if (typeof committee === 'string' || typeof committee === 'number') {
                        // committee_id is just an ID, not expanded - look up the name
                        committeeId = committee;
                        committeeName = committeeMap.get(committeeId) || 'Onbekend';
                    } else {
                        return;
                    }

                    if (!committeeCounts[committeeId]) {
                        committeeCounts[committeeId] = { name: committeeName, count: 0 };
                    }
                    committeeCounts[committeeId].count++;
                }
            });

            // Find committee with most activities
            const sortedCommittees = Object.values(committeeCounts).sort((a, b) => b.count - a.count);
            const topCommittee = sortedCommittees[0];

            return topCommittee || undefined;
        } catch (error) {
            console.error('Failed to fetch top committee:', error);
            return undefined;
        }
    };

    const fetchUpcomingEventsWithSignups = async () => {
        try {
            const allEvents = await directusFetch<any[]>('/items/events?fields=id,name,event_date&limit=-1');
            const now = new Date();

            const upcoming = allEvents.filter(event => new Date(event.event_date) >= now);

            // Get signup counts for each upcoming event
            const eventsWithSignups = await Promise.all(
                upcoming.slice(0, 5).map(async (event) => {
                    try {
                        const signups = await directusFetch<any>(`/items/event_signups?aggregate[count]=*&filter[event_id][_eq]=${event.id}`);
                        return {
                            id: event.id,
                            name: event.name,
                            event_date: event.event_date,
                            signups: signups?.[0]?.count || 0
                        };
                    } catch (error) {
                        return {
                            id: event.id,
                            name: event.name,
                            event_date: event.event_date,
                            signups: 0
                        };
                    }
                })
            );

            return eventsWithSignups;
        } catch (error) {
            console.error('Failed to fetch upcoming events with signups:', error);
            return [];
        }
    };

    const fetchPubCrawlStats = async () => {
        try {
            // Get upcoming pub crawl event
            const allEvents = await directusFetch<any[]>('/items/pub_crawl_events?fields=id,name,date&sort=-date');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvent = allEvents.find(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            });

            if (!upcomingEvent) {
                return { signups: 0, upcomingEvent: undefined };
            }

            // Get all signups for upcoming event so we can compute total tickets and groups
            const signupsItems = await directusFetch<any[]>(`/items/pub_crawl_signups?filter[pub_crawl_event_id][_eq]=${upcomingEvent.id}&limit=-1&fields=id,amount_tickets`);
            const groups = Array.isArray(signupsItems) ? signupsItems.length : 0;
            const totalTickets = Array.isArray(signupsItems)
                ? signupsItems.reduce((sum, s) => sum + (Number(s.amount_tickets) || 0), 0)
                : 0;

            return {
                signups: groups,
                totalTickets,
                groups,
                upcomingEvent: {
                    id: upcomingEvent.id,
                    name: upcomingEvent.name,
                    date: upcomingEvent.date
                }
            };
        } catch (error) {
            console.error('Failed to fetch pub crawl stats:', error);
            return { signups: 0, upcomingEvent: undefined };
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
                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => router.push('/admin/activiteiten/nieuw')}
                        className="bg-admin-card text-theme-purple hover:bg-admin-card-soft hover:text-theme-purple-dark px-4 sm:px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <Plus className="h-5 w-5" />
                        Nieuwe Activiteit
                    </button>
                    <button
                        onClick={() => router.push('/admin/activiteiten')}
                        className="bg-admin-card text-theme-purple hover:bg-admin-card-soft hover:text-theme-purple-dark px-4 sm:px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <FileText className="h-5 w-5" />
                        Beheer Activiteiten
                    </button>
                    {canManageReis && (
                        <button
                            onClick={() => router.push('/admin/reis')}
                            className="bg-white dark:bg-slate-800 text-theme-purple dark:text-theme-purple-light hover:bg-slate-50 dark:hover:bg-slate-700 px-4 sm:px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl dark:shadow-slate-900/50 transition-all hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            <Activity className="h-5 w-5" />
                            Beheer Reis
                        </button>
                    )}
                    <button
                        onClick={() => router.push('/admin/leden')}
                        className="bg-admin-card text-theme-purple hover:bg-admin-card-soft hover:text-theme-purple-dark px-4 sm:px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <Users className="h-5 w-5" />
                        Beheer Leden
                    </button>
                </div>

                {/* Financieel & Beheer */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Coupons"
                            value={stats.totalCoupons}
                            icon={<Ticket className="h-6 w-6" />}
                            subtitle="Actieve coupons"
                            onClick={() => router.push('/admin/coupons')}
                            colorClass="green"
                        />

                        {user?.entra_id && (
                            <StatCard
                                title="Signups"
                                value="Beheer"
                                icon={<Shield className="h-6 w-6" />}
                                subtitle="Alle aanmeldingen"
                                onClick={() => router.push('/admin/dev-signups')}
                                colorClass="red"
                            />
                        )}

                        {stats.upcomingPubCrawl && (
                            <StatCard
                                title="Kroegentocht Aanmeldingen"
                                value={stats.pubCrawlTickets ?? 0}
                                icon={<Ticket className="h-6 w-6" />}
                                subtitle={`${stats.upcomingPubCrawl.name} • ${stats.pubCrawlGroups ?? 0} groepen`}
                                onClick={() => router.push('/admin/kroegentocht')}
                                colorClass="purple"
                            />
                        )}
                    </div>
                </div>

                {/* Grouped Cards - Horizontal Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Events & Activiteiten - Purple Theme */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                title="Aankomende Events"
                                value={stats.upcomingEvents}
                                icon={<Calendar className="h-6 w-6" />}
                                subtitle={`Van ${stats.totalEvents} totaal`}
                                onClick={() => router.push('/admin/activiteiten')}
                                colorClass="purple"
                            />

                            <StatCard
                                title="Totaal Inschrijvingen"
                                value={stats.totalSignups}
                                icon={<UserCheck className="h-6 w-6" />}
                                subtitle="Alle activiteiten"
                                onClick={() => router.push('/activiteiten')}
                                colorClass="purple"
                            />

                            <div className="col-span-2 w-full">
                                <StatCard
                                    title="Meeste Activiteiten"
                                    value={stats.topCommittee ? cleanCommitteeName(stats.topCommittee.name) : 'Geen data'}
                                    icon={<FileText className="h-6 w-6" />}
                                    subtitle={stats.topCommittee ? `${stats.topCommittee.count} ${stats.topCommittee.count === 1 ? 'activiteit' : 'activiteiten'} dit jaar` : undefined}
                                    onClick={() => router.push('/commissies')}
                                    colorClass="purple"
                                />
                            </div>
                        </div>

                        {/* Stickers - Orange Theme */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                title="Totaal Stickers"
                                value={stats.totalStickers}
                                icon={<Sticker className="h-6 w-6" />}
                                subtitle="Alle verzamelde stickers"
                                onClick={() => router.push('/stickers')}
                                colorClass="orange"
                            />

                            <StatCard
                                title="Sticker Groei"
                                value={`${stats.stickerGrowthRate}%`}
                                icon={<TrendingUp className="h-6 w-6" />}
                                subtitle="Laatste 7 dagen"
                                onClick={() => router.push('/stickers')}
                                colorClass="orange"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Intro - Blue Theme */}
                        <div className="grid grid-cols-2 gap-4">
                            {stats.mostLikedPost && (
                                <div className="col-span-2 w-full">
                                    <div className="w-full h-full">
                                        <StatCard
                                            title="Populairste Post"
                                            value={stats.mostLikedPost.title}
                                            icon={<Heart className="h-6 w-6" />}
                                            subtitle={`${stats.mostLikedPost.likes} likes`}
                                            onClick={() => router.push('/intro/blog')}
                                            colorClass="blue"
                                        />
                                    </div>
                                </div>
                            )}

                            <StatCard
                                title="Intro Aanmeldingen"
                                value={stats.introSignups}
                                icon={<Mail className="h-6 w-6" />}
                                subtitle="Totaal aanmeldingen"
                                onClick={() => router.push('/intro')}
                                colorClass="blue"
                            />

                            <StatCard
                                title="Blog Likes"
                                value={stats.introBlogLikes}
                                icon={<Heart className="h-6 w-6" />}
                                subtitle="Alle intro blogs"
                                onClick={() => router.push('/intro/blog')}
                                colorClass="blue"
                            />
                        </div>

                        {/* Kroegentocht stat moved to top row */}

                        {/* Members - Green Theme */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                title="Alle Leden"
                                value="Overzicht"
                                icon={<Users className="h-6 w-6" />}
                                subtitle="Beheer gebruikers & lidmaatschappen"
                                onClick={() => router.push('/admin/leden')}
                                colorClass="green"
                            />

                            <StatCard
                                title="Commissieleden"
                                value={stats.totalCommitteeMembers}
                                icon={<Users className="h-6 w-6" />}
                                subtitle="Actieve leden"
                                onClick={() => router.push('/commissies')}
                                colorClass="green"
                            />

                            <StatCard
                                title="Jarigen Komende Week"
                                value={stats.upcomingBirthdays.length}
                                icon={<Cake className="h-6 w-6" />}
                                subtitle="Vergeet niet te feliciteren!"
                                colorClass="green"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Upcoming Events with Signups */}
                    <ListCard
                        title="Aankomende Events"
                        icon={<Calendar className="h-5 w-5" />}
                    >
                        {stats.upcomingEventsWithSignups.length > 0 ? (
                            <div className="space-y-3">
                                {stats.upcomingEventsWithSignups.map(event => (
                                    <button
                                        key={event.id}
                                        onClick={() => router.push(`/activiteiten/${event.id}`)}
                                        className="flex items-center justify-between p-3 bg-admin-card-soft rounded-xl w-full hover:bg-admin-hover transition"
                                    >
                                        <div className="text-left">
                                            <p className="font-semibold text-admin line-clamp-1">
                                                {event.name}
                                            </p>
                                            <p className="text-sm text-admin-muted">{formatDate(event.event_date)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-theme-purple">{event.signups}</span>
                                            <UserCheck className="h-5 w-5 text-theme-purple" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-admin-muted text-center py-4">Geen aankomende events</p>
                        )}
                    </ListCard>

                    {/* Upcoming Birthdays */}
                    <ListCard
                        title="Aankomende Jarigen"
                        icon={<Cake className="h-5 w-5" />}
                    >
                        {stats.upcomingBirthdays.length > 0 ? (
                            <div className="space-y-3">
                                {stats.upcomingBirthdays.map(person => (
                                    <div key={person.id} className="flex items-center justify-between p-3 bg-admin-card-soft rounded-xl">
                                        <div>
                                            <p className="font-semibold text-admin">
                                                {person.first_name} {person.last_name}
                                            </p>
                                            <p className="text-sm text-admin-muted">{formatDate(person.birthday)}</p>
                                        </div>
                                        <Cake className="h-5 w-5 text-theme-purple" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-admin-muted text-center py-4">Geen jarigen deze week</p>
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
                                    <div key={person.id} className="flex items-center justify-between p-3 bg-admin-card-soft rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500 dark:bg-yellow-600' :
                                                index === 1 ? 'bg-slate-400 dark:bg-slate-500' :
                                                    'bg-orange-600 dark:bg-orange-700'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-admin">
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
                            <p className="text-admin-muted text-center py-4">Geen stickers gevonden</p>
                        )}
                    </ListCard>
                </div>

                {/* System Health - ICT Only */}
                {isIctMember && (
                    <div className="mt-8">
                        <ListCard
                            title="Systeemstatus"
                            icon={<Activity className="h-5 w-5" />}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
                                        <div>
                                            <p className="font-semibold text-admin">API Status</p>
                                            <p className="text-sm text-admin-muted">Operationeel</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-admin-card-soft rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-admin-muted" />
                                        <div>
                                            <p className="font-semibold text-admin">Recente Fouten</p>
                                            <p className="text-sm text-admin-muted">Laatste 24 uur</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-admin-muted">{stats.systemErrors}</span>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>ICT Dashboard:</strong> Alleen zichtbaar voor ICT commissieleden.
                                    </p>
                                </div>
                            </div>
                        </ListCard>
                    </div>
                )}

                {/* Additional Info removed */}
            </div>
        </>
    );
}
