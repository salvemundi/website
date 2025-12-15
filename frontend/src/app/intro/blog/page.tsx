'use client';

import React, { useState, useMemo, useEffect } from 'react';
import HeroBanner from '@/components/HeroBanner';
import AuthorCard from '@/components/AuthorCard';
import TagList from '@/components/TagList';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { introBlogsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Newspaper, Image as ImageIcon, Megaphone, PartyPopper, X, Filter, Heart, MessageCircle, Share2, Mail } from 'lucide-react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import { toast } from 'sonner';

export default function IntroBlogPage() {
    const [selectedBlog, setSelectedBlog] = useState<any>(null);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const [likedBlogs, setLikedBlogs] = useState<number[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('likedBlogs');
            if (raw) setLikedBlogs(JSON.parse(raw));
        } catch (e) {
            // ignore
        }
    }, []);

    // Fetch intro blogs/updates
    const queryClient = useQueryClient();
    const { data: introBlogs, isLoading } = useQuery({
        queryKey: ['intro-blogs'],
        queryFn: introBlogsApi.getAll,
    });

    // Fetch committee_members rows for current user to determine committee membership
    const { data: committeeRows = [] } = useQuery({
        queryKey: ['user-committee-members', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            try {
                // Query committee_members table for the current user
                // This matches the pattern used in qr-service.ts and salvemundi.ts
                return await directusFetch<any[]>(
                    `/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(user.id)}&fields=*,committee_id.id,committee_id.name`
                );
            } catch (e) {
                console.warn('Failed to fetch committee memberships for user', e);
                return [];
            }
        },
        enabled: Boolean(user?.id),
    });

    // Check if user has permission to send emails (intro commissie or bestuur)
    const canSendEmails = useMemo(() => {
        // If not authenticated, no permission
        if (!isAuthenticated) return false;

        // Prefer checking committee_members table rows
        if (committeeRows && committeeRows.length > 0) {
            return committeeRows.some((row: any) => {
                const name = (row.committee_id && row.committee_id.name) || '';
                return name.toLowerCase().includes('intro') || name.toLowerCase().includes('bestuur');
            });
        }

        // Fallback to user.committees (older mapping)
        if (user?.committees && user.committees.length > 0) {
            return user.committees.some((committee: any) => {
                const name = committee.name || committee?.committee_id?.name || '';
                return name.toLowerCase().includes('intro') || name.toLowerCase().includes('bestuur');
            });
        }

        return false;
    }, [isAuthenticated, committeeRows, user]);

    // Get unique blog types for filtering
    const blogTypes = useMemo(() => {
        if (!introBlogs) return [];
        const types = [...new Set(introBlogs.map(blog => blog.blog_type))];
        return types;
    }, [introBlogs]);

    // Filter blogs based on selected type
    const filteredBlogs = useMemo(() => {
        if (!introBlogs) return [];
        if (!selectedFilter) return introBlogs;
        return introBlogs.filter(blog => blog.blog_type === selectedFilter);
    }, [introBlogs, selectedFilter]);

    const getBlogTypeConfig = (type: string) => {
        switch (type) {
            case 'pictures':
                return { label: 'Foto\'s', color: 'bg-blue-500', icon: ImageIcon };
            case 'event':
                return { label: 'Evenement', color: 'bg-green-500', icon: PartyPopper };
            case 'announcement':
                return { label: 'Aankondiging', color: 'bg-red-500', icon: Megaphone };
            case 'update':
            default:
                return { label: 'Update', color: 'bg-purple-500', icon: Newspaper };
        }
    };

    const handleSendEmail = async (blog: any) => {
        if (!canSendEmails) {
            toast.error('Je hebt geen toestemming om emails te versturen');
            return;
        }

        // store id as string to match state type (string | null)
        setSendingEmail(String(blog.id));
        const toastId = toast.loading('Email versturen naar alle intro deelnemers...');

        try {
            // Use the new API route that fetches subscribers from Directus
            const resp = await fetch('/api/send-intro-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    blogTitle: blog.title,
                    blogExcerpt: blog.excerpt || blog.content.substring(0, 200),
                    blogUrl: `${window.location.origin}/intro/blog`,
                    blogImage: blog.image ? getImageUrl(blog.image) : null,
                }),
            });

            if (!resp.ok) {
                // Try to parse JSON error body, otherwise read text
                let details: string | undefined;
                try {
                    const body = await resp.json();
                    details = JSON.stringify(body);
                } catch (e) {
                    try {
                        details = await resp.text();
                    } catch (e2) {
                        details = undefined;
                    }
                }
                const errMsg = `Email API error: ${resp.status} ${resp.statusText}${details ? ' - ' + details : ''}`;
                console.error(errMsg);
                toast.error(errMsg, { id: toastId });
                throw new Error(errMsg);
            }

            const result = await resp.json();
            toast.success(`Email verzonden naar ${result.sentCount || 0} deelnemers!`, { id: toastId });
        } catch (error: any) {
            console.error('Failed to send email:', error);
            // If the error already produced a toast above, avoid double toast
            if (!error || !String(error).includes('Email API error')) {
                toast.error('Er is iets misgegaan bij het versturen van de email', { id: toastId });
            }
        } finally {
            setSendingEmail(null);
        }
    };

    return (
        <>
            <main className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Banner */}
                    <HeroBanner
                        title="Welkom bij de Intro Blog!"
                        subtitle="Blijf op de hoogte van alle updates, foto's en aankondigingen voor de introweek"
                        image={{
                            src: "/img/backgrounds/intro-banner.jpg",
                            alt: "Intro Banner",
                            priority: true
                        }}
                        cta={{
                            label: "Meld je aan voor de intro",
                            href: "/intro",
                            variant: "primary"
                        }}
                    />

                    {/* Two Column Layout: Main Content + Sidebar */}
                    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
     

                            {/* Filter Bar */}
                            {blogTypes.length > 0 && (
                                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                                    <Filter className="w-5 h-5 text-theme-purple flex-shrink-0" />
                                    <button
                                        onClick={() => setSelectedFilter(null)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                            selectedFilter === null
                                                ? 'bg-gradient-theme text-white shadow-md'
                                                : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                        }`}
                                    >
                                        Alles
                                    </button>
                                    {blogTypes.map((type) => {
                                        const typeConfig = getBlogTypeConfig(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedFilter(type)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                                    selectedFilter === type
                                                        ? 'bg-gradient-theme text-white shadow-md'
                                                        : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                                }`}
                                            >
                                                {typeConfig.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {isLoading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-theme-purple"></div>
                                    <p className="text-theme-muted mt-4">Blogs laden...</p>
                                </div>
                            ) : !filteredBlogs || filteredBlogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <Newspaper className="w-16 h-16 text-theme-purple/30 mx-auto mb-4" />
                                    <p className="text-theme-muted text-lg">
                                        {selectedFilter 
                                            ? `Geen ${getBlogTypeConfig(selectedFilter).label.toLowerCase()} updates gevonden.`
                                            : 'Er zijn nog geen updates beschikbaar. Check later terug!'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredBlogs.map((blog) => {
                                        const typeConfig = getBlogTypeConfig(blog.blog_type);
                                        const TypeIcon = typeConfig.icon;
                                        
                                        return (
                                            <article
                                                key={blog.id}
                                                className="bg-[var(--bg-card)] rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                                            >
                                                {/* Post Header */}
                                                <div className="flex items-center gap-3 p-4">
                                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-theme flex items-center justify-center text-white font-bold text-sm lg:text-base flex-shrink-0">
                                                        I
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-bold text-theme text-sm lg:text-base">Intro Commissie</h3>
                                                            <span className={`${typeConfig.color} text-white text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                                                <TypeIcon className="w-2.5 h-2.5" />
                                                                {typeConfig.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-theme-muted">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(blog.published_date), 'd MMMM yyyy', { locale: nl })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Post Content */}
                                                <div 
                                                    onClick={() => setSelectedBlog(blog)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="px-4 pb-3">
                                                        <h2 className="text-xl lg:text-2xl font-bold text-theme mb-2">{blog.title}</h2>
                                                        <p className="text-sm lg:text-base text-theme-muted line-clamp-3">
                                                            {blog.excerpt || blog.content.substring(0, 200) + '...'}
                                                        </p>
                                                    </div>

                                                    {/* Post Image */}
                                                    {blog.image && (
                                                        <div className="relative w-full overflow-hidden" style={{ maxHeight: '500px' }}>
                                                            <img
                                                                src={getImageUrl(blog.image)}
                                                                alt={blog.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    {!blog.image && (
                                                        <div className="relative w-full h-64 bg-gradient-theme flex items-center justify-center">
                                                            <TypeIcon className="w-16 h-16 lg:w-20 lg:h-20 text-white/30" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Bar */}
                                                <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (!isAuthenticated) {
                                                                setShowLoginModal(true);
                                                                return;
                                                            }
                                                            if (likedBlogs.includes(blog.id)) {
                                                                toast('Je hebt dit al geliked');
                                                                return;
                                                            }
                                                            let previous: any[] | undefined;
                                                            try {
                                                                // Optimistic UI: update cache first
                                                                previous = queryClient.getQueryData<any[]>(['intro-blogs']);
                                                                queryClient.setQueryData(['intro-blogs'], (old: any[] | undefined) => {
                                                                    if (!old) return old;
                                                                    return old.map((b) => b.id === blog.id ? { ...b, likes: (b.likes || 0) + 1 } : b);
                                                                });

                                                                const resp = await fetch('/api/blog-like', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ blogId: blog.id, userId: user?.id }),
                                                                });

                                                                if (resp.ok) {
                                                                    const json = await resp.json();
                                                                    // Reconcile with server value
                                                                    queryClient.setQueryData(['intro-blogs'], (old: any[] | undefined) => {
                                                                        if (!old) return old;
                                                                        return old.map((b) => b.id === blog.id ? { ...b, likes: json.likes ?? (b.likes || 0) } : b);
                                                                    });
                                                                    // update selectedBlog if open
                                                                    if (selectedBlog && selectedBlog.id === blog.id) {
                                                                        setSelectedBlog({ ...selectedBlog, likes: json.likes ?? (selectedBlog.likes || 0) });
                                                                    }

                                                                    // record liked locally to prevent repeat likes in UI
                                                                    const next = Array.from(new Set([...likedBlogs, blog.id]));
                                                                    setLikedBlogs(next);
                                                                    try { localStorage.setItem('likedBlogs', JSON.stringify(next)); } catch (e) {}

                                                                    toast.success('Bedankt voor je like!');
                                                                } else {
                                                                    // rollback
                                                                    if (previous) queryClient.setQueryData(['intro-blogs'], previous as any[] | undefined);
                                                                    const txt = await resp.text().catch(() => undefined);
                                                                    toast.error('Kon like niet registreren');
                                                                    console.error('Like API error', resp.status, txt);
                                                                }
                                                            } catch (err) {
                                                                // rollback on error
                                                                if (previous) queryClient.setQueryData(['intro-blogs'], previous as any[] | undefined);
                                                                console.error('Failed to call like API', err);
                                                                toast.error('Er ging iets mis bij liken');
                                                            }
                                                        }}
                                                        disabled={!isAuthenticated || likedBlogs.includes(blog.id)}
                                                        title={!isAuthenticated ? 'Log in om te liken' : (likedBlogs.includes(blog.id) ? 'Je hebt dit al geliked' : 'Leuk vinden')}
                                                        className="flex items-center gap-2 text-theme-muted hover:text-theme-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Heart className="w-5 h-5" />
                                                        <span className="text-sm">Leuk vinden</span>
                                                        <span className="text-sm text-theme-muted ml-2">{blog.likes ?? 0}</span>
                                                    </button>
                                                    <button className="flex items-center gap-2 text-theme-muted hover:text-theme-purple transition-colors">
                                                        <Share2 className="w-5 h-5" />
                                                        <span className="text-sm">Delen</span>
                                                    </button>
                                                    {canSendEmails && (
                                                        <button 
                                                            onClick={() => handleSendEmail(blog)}
                                                            disabled={sendingEmail === String(blog.id)}
                                                            className="flex items-center gap-2 text-theme-muted hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                                        >
                                                            <Mail className="w-5 h-5" />
                                                            <span className="text-sm">
                                                                {sendingEmail === String(blog.id) ? 'Versturen...' : 'Email naar deelnemers'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-6">
                            {/* Newsletter Signup removed - subscriptions are now automatically handled on intro signup */}

                            {/* Author Card */}
                            <AuthorCard
                                name="Intro Commissie"
                                bio="Het team dat de beste introweek voor je organiseert!"
                                email="intro@salvemundi.nl"
                                socials={[
                                    { provider: 'instagram', href: 'https://instagram.com/salvemundi', label: 'Instagram' },
                                    { provider: 'facebook', href: 'https://facebook.com/salvemundi', label: 'Facebook' },
                                ]}
                            />

                            {/* Tag/Topic List */}
                            {blogTypes.length > 0 && (
                                <TagList
                                    tags={blogTypes.map(type => getBlogTypeConfig(type).label)}
                                    selectedTags={selectedFilter ? [getBlogTypeConfig(selectedFilter).label] : []}
                                    onClick={(tag) => {
                                        const type = blogTypes.find(t => getBlogTypeConfig(t).label === tag);
                                        setSelectedFilter(type || null);
                                    }}
                                />
                            )}
                        </aside>
                    </div>
                </div>
            </main>

            {/* Login Required Modal */}
            <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Blog Detail Modal */}
            {selectedBlog && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedBlog(null)}
                >
                    <div
                        className="bg-[var(--bg-card)] rounded-2xl lg:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedBlog.image && (
                            <div className="relative w-full overflow-hidden rounded-t-2xl lg:rounded-t-3xl">
                                <img
                                    src={getImageUrl(selectedBlog.image)}
                                    alt={selectedBlog.title}
                                    className="w-full h-56 sm:h-64 md:h-80 lg:h-96 object-cover"
                                />

                                {/* Close button overlays the image on mobile and is positioned inside the modal on desktop */}
                                <button
                                    onClick={() => setSelectedBlog(null)}
                                    className="absolute right-3 top-3 p-2 rounded-full bg-black/40 hover:bg-black/50 text-white z-20 lg:hidden"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Desktop close button (kept for larger screens) */}
                        <button
                            onClick={() => setSelectedBlog(null)}
                            className="hidden lg:block sticky top-2 float-right m-3 lg:m-4 p-2 rounded-full bg-theme-purple/20 hover:bg-theme-purple/30 transition-colors z-10"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                        </button>

                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-4">
                                {(() => {
                                    const typeConfig = getBlogTypeConfig(selectedBlog.blog_type);
                                    const TypeIcon = typeConfig.icon;
                                    return (
                                        <div className={`${typeConfig.color} text-white text-xs lg:text-sm font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-full flex items-center gap-1.5 lg:gap-2`}>
                                            <TypeIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                                            {typeConfig.label}
                                        </div>
                                    );
                                })()}
                                <div className="flex items-center gap-2 text-theme-muted text-xs lg:text-sm">
                                    <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                                    {format(new Date(selectedBlog.published_date), 'd MMMM yyyy', { locale: nl })}
                                </div>
                            </div>

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-4 lg:mb-6">
                                {selectedBlog.title}
                            </h2>

                            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none text-theme">
                                <div
                                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                                    className="whitespace-pre-wrap"
                                />
                            </div>

                            {selectedBlog.gallery && selectedBlog.gallery.length > 0 && (
                                <div className="mt-6 lg:mt-8">
                                    <h3 className="text-xl lg:text-2xl font-bold text-theme mb-3 lg:mb-4 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                                        Fotogalerij
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
                                        {selectedBlog.gallery.map((imageId: string, index: number) => (
                                            <div key={index} className="relative aspect-square rounded-lg lg:rounded-xl overflow-hidden shadow-lg">
                                                <img
                                                    src={getImageUrl(imageId)}
                                                    alt={`Gallery image ${index + 1}`}
                                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
