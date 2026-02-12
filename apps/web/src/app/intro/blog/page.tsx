'use client';

import { useState, useMemo, useEffect } from 'react';
import HeroBanner from '@/components/HeroBanner';
import AuthorCard from '@/components/AuthorCard';
import TagList from '@/components/TagList';
import { introBlogsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Newspaper, Image as ImageIcon, Megaphone, PartyPopper, X, Filter, Heart, Mail } from 'lucide-react';
import { useAuth, useAuthActions } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/shared/lib/utils/sanitize';
import { likeBlogAction, unlikeBlogAction, sendIntroUpdateAction } from '@/shared/api/blog-actions';

interface IntroBlog {
    id: number | string;
    title: string;
    excerpt?: string;
    content?: string;
    image?: string | { id: number; filename?: string } | null;
    blog_type?: string;
    updated_at?: string;
    gallery?: string[];
    likes?: number;
}

interface CommitteeRow {
    id: number;
    committee_id?: { id: number; name?: string };
}

interface UserCommittee {
    id?: number | string;
    name?: string;
    committee_id?: { name?: string };
}

export default function IntroBlogPage() {
    const [selectedBlog, setSelectedBlog] = useState<IntroBlog | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { loginWithMicrosoft } = useAuthActions();
    const [likedBlogs, setLikedBlogs] = useState<(number | string)[]>([]);
    const [likeLoadingId, setLikeLoadingId] = useState<number | string | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('likedBlogs');
            if (raw) setLikedBlogs(JSON.parse(raw));
        } catch (e) {
            // ignore
        }
    }, []);

    // Ensure we don't show liked state when the user is not authenticated.
    useEffect(() => {
        if (!isAuthenticated) {
            setLikedBlogs([]);
        }
    }, [isAuthenticated]);

    // initialize liked blogs from server for authenticated user
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const ctrl = new AbortController();
        (async () => {
            try {
                const resp = await fetch(`/api/blog-liked?userId=${encodeURIComponent(user.id)}`, { signal: ctrl.signal });
                if (!resp.ok) return;
                const data = await resp.json();
                const ids: Array<number | string> = data?.likedBlogIds || [];
                setLikedBlogs(ids);
                try { localStorage.setItem('likedBlogs', JSON.stringify(ids)); } catch (e) { }
            } catch (err) {
                // ignore
            }
        })();
        return () => ctrl.abort();
    }, [isAuthenticated, user]);

    // Prevent background scrolling when the blog modal is open
    useEffect(() => {
        const previous = document.body.style.overflow;
        if (selectedBlog) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = previous || '';
        }
        return () => {
            document.body.style.overflow = previous;
        };
    }, [selectedBlog]);

    // Fetch intro blogs/updates
    const queryClient = useQueryClient();
    const { data: introBlogs, isLoading } = useQuery<IntroBlog[]>({
        queryKey: ['intro-blogs'],
        queryFn: introBlogsApi.getAll,
    });

    // Combine auth + data loading to avoid flashes where the unauthenticated UI
    // briefly appears while auth is being resolved.
    const initialLoading = isLoading || authLoading;


    // Fetch committee_members rows for current user to determine committee membership
    const { data: committeeRows = [] } = useQuery<CommitteeRow[]>({
        queryKey: ['user-committee-members', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            try {
                // Query committee_members table for the current user
                // This matches the pattern used in qr-service.ts and salvemundi.ts
                return await directusFetch<CommitteeRow[]>(
                    `/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(user.id)}&fields=*,committee_id.id,committee_id.name`
                );
            } catch (e) {
                // suppressed non-error log
                return [];
            }
        },
        enabled: Boolean(user?.id),
    });

    // (debug logging removed)

    // Check if user has permission to send emails (intro commissie or bestuur)
    const canSendEmails = useMemo(() => {
        // If not authenticated, no permission
        if (!isAuthenticated) return false;

        // Prefer checking committee_members table rows
        if (committeeRows && committeeRows.length > 0) {
            return committeeRows.some((row: CommitteeRow) => {
                const name = (row.committee_id && row.committee_id.name) || '';
                return name.toLowerCase().includes('intro') || name.toLowerCase().includes('bestuur');
            });
        }

        // Fallback to user.committees (older mapping)
        if (user?.committees && user.committees.length > 0) {
            return user.committees.some((committee: UserCommittee) => {
                const name = committee.name || committee?.committee_id?.name || '';
                return name.toLowerCase().includes('intro') || name.toLowerCase().includes('bestuur');
            });
        }

        return false;
    }, [isAuthenticated, committeeRows, user]);

    // Get unique blog types for filtering
    const blogTypes = useMemo(() => {
        if (!introBlogs) return [] as string[];
        const types = [...new Set(introBlogs.map(blog => blog.blog_type).filter(Boolean))] as string[];
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

    const handleSendEmail = async (blog: IntroBlog) => {
        if (!canSendEmails) {
            toast.error('Je hebt geen toestemming om emails te versturen');
            return;
        }

        // store id as string to match state type (string | null)
        setSendingEmail(String(blog.id));
        const toastId = toast.loading('Email versturen naar alle intro deelnemers...');

        try {
            const res = await sendIntroUpdateAction({
                blogTitle: blog.title,
                blogExcerpt: blog.excerpt || (blog.content ?? '').substring(0, 200),
                blogUrl: `${window.location.origin}/intro/blog`,
                blogImage: blog.image ? getImageUrl(blog.image) : null,
            });

            if (!res.success) {
                const errMsg = res.error || 'Email versturen mislukt';
                toast.error(errMsg, { id: toastId });
                throw new Error(errMsg);
            }

            const result = res.data;
            toast.success(`Email verzonden naar ${result?.sentCount || 0} deelnemers!`, { id: toastId });
        } catch (error: unknown) {
            const errString =
                typeof error === 'string'
                    ? error
                    : error instanceof Error
                        ? error.message
                        : String(error);
            console.error('Failed to send email:', errString);
            // If the error already produced a toast above, avoid double toast
            if (!errString || !errString.includes('Email API error')) {
                toast.error('Er is iets misgegaan bij het versturen van de email', { id: toastId });
            }
        } finally {
            setSendingEmail(null);
        }
    };

    return (
        <>
            <main className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 overflow-x-hidden">
                <div className="max-w-7xl w-full mx-auto">
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
                    <div className={`transition-opacity duration-500 ${initialLoading ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">


                                {/* Filter Bar */}
                                {blogTypes.length > 0 && (
                                    <>
                                        {/* Mobile: dropdown */}
                                        <div className="mb-4 md:hidden">
                                            <label className="sr-only">Filter blog posts</label>
                                            <div className="flex items-center gap-2">
                                                <Filter className="w-5 h-5 text-theme-purple flex-shrink-0" />
                                                <select
                                                    value={selectedFilter ?? ''}
                                                    onChange={(e) => setSelectedFilter(e.target.value === '' ? null : e.target.value)}
                                                    className="w-full px-4 py-2 rounded-full bg-[var(--bg-card)] border border-gray-200 text-theme text-sm"
                                                >
                                                    <option value="">Alles</option>
                                                    {blogTypes.map((type) => (
                                                        <option key={type} value={type}>{getBlogTypeConfig(type).label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Desktop: pill buttons */}
                                        <div className="hidden md:flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                                            <Filter className="w-5 h-5 text-theme-purple flex-shrink-0" />
                                            <button
                                                onClick={() => setSelectedFilter(null)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedFilter === null
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
                                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedFilter === type
                                                            ? 'bg-gradient-theme text-white shadow-md'
                                                            : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                                            }`}
                                                    >
                                                        {typeConfig.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {initialLoading ? (
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
                                            const typeConfig = getBlogTypeConfig(blog.blog_type ?? 'update');
                                            const TypeIcon = typeConfig.icon;
                                            // Only show the "liked" icon/state if the current user is authenticated
                                            // and the server/local state indicates they liked this blog.
                                            const isUserLiked = isAuthenticated && likedBlogs.includes(blog.id);

                                            return (
                                                <article
                                                    key={blog.id}
                                                    className="w-full bg-[var(--bg-card)] rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 box-border"
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
                                                                {(() => {
                                                                    const date = blog.updated_at;
                                                                    return date ? format(new Date(date), 'd MMMM yyyy', { locale: nl }) : null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Post Content */}
                                                    <div
                                                        onClick={() => setSelectedBlog(blog)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="px-4 pb-3">
                                                            <h2 className="text-xl lg:text-2xl font-bold text-theme mb-2 break-words">{blog.title}</h2>
                                                            <p className="text-sm lg:text-base text-theme-muted line-clamp-3 break-words">
                                                                {blog.excerpt || ((blog.content ?? '').substring(0, 200) + '...')}
                                                            </p>
                                                        </div>

                                                        {/* Post Image */}
                                                        {blog.image && (
                                                            <div className="relative w-full overflow-hidden" style={{ maxHeight: '500px' }}>
                                                                <img
                                                                    src={getImageUrl(blog.image)}
                                                                    alt={blog.title}
                                                                    className="w-full h-auto max-w-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        {/* No placeholder shown when there's no image */}
                                                    </div>

                                                    {/* Action Bar */}
                                                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!isAuthenticated) {
                                                                    loginWithMicrosoft();
                                                                    return;
                                                                }
                                                                if (likeLoadingId) return;
                                                                setLikeLoadingId(blog.id);
                                                                const isLiked = likedBlogs.includes(blog.id);
                                                                let previous: IntroBlog[] | undefined;
                                                                try {
                                                                    // Optimistic update
                                                                    previous = queryClient.getQueryData<IntroBlog[]>(['intro-blogs']);
                                                                    queryClient.setQueryData(['intro-blogs'], (old: IntroBlog[] | undefined) => {
                                                                        if (!old) return old;
                                                                        return old.map((b) => b.id === blog.id ? { ...b, likes: (b.likes || 0) + (isLiked ? -1 : 1) } : b);
                                                                    });

                                                                    const res = isLiked
                                                                        ? await unlikeBlogAction(blog.id, user?.id!)
                                                                        : await likeBlogAction(blog.id, user?.id!);

                                                                    if (res.success) {
                                                                        // Reconcile with server value
                                                                        queryClient.setQueryData(['intro-blogs'], (old: IntroBlog[] | undefined) => {
                                                                            if (!old) return old;
                                                                            return old.map((b) => b.id === blog.id ? { ...b, likes: res.likes ?? (b.likes || 0) } : b);
                                                                        });
                                                                        if (selectedBlog && selectedBlog.id === blog.id) {
                                                                            setSelectedBlog({ ...selectedBlog, likes: res.likes ?? (selectedBlog.likes || 0) });
                                                                        }

                                                                        let next: Array<number | string>;
                                                                        if (isLiked) {
                                                                            next = likedBlogs.filter(id => id !== blog.id);
                                                                        } else {
                                                                            next = Array.from(new Set([...likedBlogs, blog.id]));
                                                                        }
                                                                        setLikedBlogs(next);
                                                                        try { localStorage.setItem('likedBlogs', JSON.stringify(next)); } catch (e) { }

                                                                        toast.success(isLiked ? 'Like verwijderd' : 'Bedankt voor je like!');
                                                                    } else {
                                                                        // rollback
                                                                        if (previous) queryClient.setQueryData(['intro-blogs'], previous as IntroBlog[] | undefined);
                                                                        toast.error(res.error || 'Kon like niet registreren');
                                                                    }
                                                                } catch (err) {
                                                                    if (previous) queryClient.setQueryData(['intro-blogs'], previous as IntroBlog[] | undefined);
                                                                    console.error('Failed to call like API', err);
                                                                    toast.error('Er ging iets mis bij liken');
                                                                } finally {
                                                                    setLikeLoadingId(null);
                                                                }
                                                            }}
                                                            disabled={likeLoadingId === blog.id}
                                                            title={!isAuthenticated ? 'Log in om te liken' : (isUserLiked ? 'Klik om like te verwijderen' : 'Leuk vinden')}
                                                            className={`flex items-center gap-2 transition-all duration-200 ${isUserLiked
                                                                ? 'text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full shadow-md'
                                                                : 'text-theme-muted hover:text-red-500 hover:scale-110'
                                                                } ${likeLoadingId === blog.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            {likeLoadingId === blog.id ? (
                                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                            ) : isUserLiked ? (
                                                                <svg className="w-5 h-5 animate-[pulse_0.5s_ease-in-out]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                                </svg>
                                                            ) : (
                                                                <Heart className="w-5 h-5" />
                                                            )}
                                                            <span className="text-sm font-medium">{isUserLiked ? 'Geliked' : 'Leuk vinden'}</span>
                                                            <span className={`text-sm font-semibold ${isUserLiked ? 'text-white' : 'text-theme-muted'}`}>{blog.likes ?? 0}</span>
                                                        </button>
                                                        {/* Share button removed */}
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
                </div>
            </main>


            {/* Blog Detail Modal */}
            {selectedBlog && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedBlog(null)}
                >
                    <div
                        className="bg-[var(--bg-card)] rounded-2xl lg:rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl my-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedBlog.image && (
                            <div className="relative w-full overflow-hidden rounded-t-2xl lg:rounded-t-3xl">
                                <img
                                    src={getImageUrl(selectedBlog.image)}
                                    alt={selectedBlog.title}
                                    className="w-full h-56 sm:h-64 md:h-72 object-cover"
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
                                    const typeConfig = getBlogTypeConfig(selectedBlog.blog_type ?? 'update');
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
                                    {selectedBlog.updated_at ? format(new Date(selectedBlog.updated_at), 'd MMMM yyyy', { locale: nl }) : null}
                                </div>
                            </div>

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-4 lg:mb-6">
                                {selectedBlog.title}
                            </h2>

                            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none text-theme break-words overflow-hidden max-w-full">
                                <div
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedBlog.content ?? '') }}
                                    className="whitespace-pre-wrap break-words"
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
                                                    className="w-full h-auto max-w-full object-cover hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detail action bar (like button) */}
                            <div className="border-t mt-6 pt-4 px-0">
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        const selectedIsUserLiked = isAuthenticated && likedBlogs.includes(selectedBlog.id);
                                        return (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!isAuthenticated) {
                                                        loginWithMicrosoft();
                                                        return;
                                                    }
                                                    if (likeLoadingId) return;
                                                    setLikeLoadingId(selectedBlog.id);
                                                    const isLiked = likedBlogs.includes(selectedBlog.id);
                                                    let previous: IntroBlog[] | undefined;
                                                    try {
                                                        previous = queryClient.getQueryData<IntroBlog[]>(['intro-blogs']);
                                                        queryClient.setQueryData(['intro-blogs'], (old: IntroBlog[] | undefined) => {
                                                            if (!old) return old;
                                                            return old.map((b) => b.id === selectedBlog.id ? { ...b, likes: (b.likes || 0) + (isLiked ? -1 : 1) } : b);
                                                        });

                                                        const res = isLiked
                                                            ? await unlikeBlogAction(selectedBlog.id, user?.id!)
                                                            : await likeBlogAction(selectedBlog.id, user?.id!);

                                                        if (res.success) {
                                                            queryClient.setQueryData(['intro-blogs'], (old: IntroBlog[] | undefined) => {
                                                                if (!old) return old;
                                                                return old.map((b) => b.id === selectedBlog.id ? { ...b, likes: res.likes ?? (b.likes || 0) } : b);
                                                            });

                                                            setSelectedBlog({ ...selectedBlog, likes: res.likes ?? (selectedBlog.likes || 0) });

                                                            let next: Array<number | string>;
                                                            if (isLiked) {
                                                                next = likedBlogs.filter(id => id !== selectedBlog.id);
                                                            } else {
                                                                next = Array.from(new Set([...likedBlogs, selectedBlog.id]));
                                                            }
                                                            setLikedBlogs(next);
                                                            try { localStorage.setItem('likedBlogs', JSON.stringify(next)); } catch (e) { }

                                                            toast.success(isLiked ? 'Like verwijderd' : 'Bedankt voor je like!');
                                                        } else {
                                                            if (previous) queryClient.setQueryData(['intro-blogs'], previous as IntroBlog[] | undefined);
                                                            toast.error(res.error || 'Kon like niet registreren');
                                                        }
                                                    } catch (err) {
                                                        if (previous) queryClient.setQueryData(['intro-blogs'], previous as IntroBlog[] | undefined);
                                                        console.error('Failed to call like API', err);
                                                        toast.error('Er ging iets mis bij liken');
                                                    } finally {
                                                        setLikeLoadingId(null);
                                                    }
                                                }}
                                                disabled={likeLoadingId === selectedBlog.id}
                                                title={!isAuthenticated ? 'Log in om te liken' : (selectedIsUserLiked ? 'Klik om like te verwijderen' : 'Leuk vinden')}
                                                className={`flex items-center gap-2 transition-all duration-200 ${selectedIsUserLiked
                                                    ? 'text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full shadow-md'
                                                    : 'text-theme-muted hover:text-red-500 hover:scale-110'
                                                    } ${likeLoadingId === selectedBlog.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                {likeLoadingId === selectedBlog.id ? (
                                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                ) : selectedIsUserLiked ? (
                                                    <svg className="w-5 h-5 animate-[pulse_0.5s_ease-in-out]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                    </svg>
                                                ) : (
                                                    <Heart className="w-5 h-5" />
                                                )}
                                                <span className="text-sm font-medium">{selectedIsUserLiked ? 'Geliked' : 'Leuk vinden'}</span>
                                                <span className={`text-sm font-semibold ${selectedIsUserLiked ? 'text-white' : 'text-theme-muted'}`}>{selectedBlog.likes ?? 0}</span>
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
