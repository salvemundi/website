'use client';

import React, { useState, useMemo } from 'react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import HeroBanner from '@/components/HeroBanner';
import AuthorCard from '@/components/AuthorCard';
import TagList from '@/components/TagList';
import { introBlogsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import type { IntroBlog } from '@/shared/lib/api/salvemundi';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Newspaper, Image as ImageIcon, Megaphone, PartyPopper, X, Filter } from 'lucide-react';

export default function IntroBlogPage() {
    const [selectedBlog, setSelectedBlog] = useState<any>(null);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Fetch intro blogs/updates
    const { data: introBlogs, isLoading } = useQuery<IntroBlog[], Error>({
        queryKey: ['intro-blogs'],
        queryFn: introBlogsApi.getAll,
    });

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

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader title="INTRO - BLOG & UPDATES" backgroundImage="/img/backgrounds/intro-banner.jpg" />
            </div>

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

                    {/* Newsletter Signup removed - subscriptions are now automatically handled on intro signup */}

                    {/* Two Column Layout: Main Content + Sidebar */}
                    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="text-center mb-8 lg:mb-10">
                                <div className="inline-flex items-center gap-2 mb-4">
                                    <Newspaper className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gradient">Intro Updates & Nieuws</h2>
                                </div>
                                <p className="text-theme-muted text-base lg:text-lg">
                                    Blijf op de hoogte van de laatste ontwikkelingen rondom de introweek
                                </p>
                            </div>

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
                                <div className="flex flex-col gap-6">
                                    {filteredBlogs.map((blog) => {
                                        try { console.debug('[blog.render.enhanced] ', { id: blog.id, created_at: blog.created_at, updated_at: blog.updated_at }); } catch (e) {}
                                        const typeConfig = getBlogTypeConfig(blog.blog_type);
                                        const TypeIcon = typeConfig.icon;
                                        
                                        return (
                                            <div
                                                key={blog.id}
                                                onClick={() => setSelectedBlog(blog)}
                                                className="w-full bg-[var(--bg-card)] rounded-xl lg:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                            >
                                                {blog.image && (
                                                    <div className="relative h-40 sm:h-48 overflow-hidden">
                                                        <img
                                                            src={getImageUrl(blog.image)}
                                                            alt={blog.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className={`absolute top-2 right-2 lg:top-3 lg:right-3 ${typeConfig.color} text-white text-[10px] lg:text-xs font-bold px-2 py-1 lg:px-3 rounded-full flex items-center gap-1`}>
                                                            <TypeIcon className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                                                            {typeConfig.label}
                                                        </div>
                                                    </div>
                                                )}
                                                {!blog.image && (
                                                    <div className="relative h-40 sm:h-48 bg-gradient-theme flex items-center justify-center">
                                                        <TypeIcon className="w-12 h-12 lg:w-16 lg:h-16 text-white/50" />
                                                        <div className={`absolute top-2 right-2 lg:top-3 lg:right-3 ${typeConfig.color} text-white text-[10px] lg:text-xs font-bold px-2 py-1 lg:px-3 rounded-full flex items-center gap-1`}>
                                                            <TypeIcon className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                                                            {typeConfig.label}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-4 lg:p-6">
                                                                            <div className="flex items-center gap-2 text-xs lg:text-sm text-theme-muted mb-2">
                                                                                <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                                                                                {(() => {
                                                                                    const d = blog.updated_at || blog.created_at || null;
                                                                                    return d && !isNaN(new Date(d).getTime()) ? format(new Date(d), 'd MMMM yyyy', { locale: nl }) : '—';
                                                                                })()}
                                                                            </div>
                                                    <h3 className="text-lg lg:text-xl font-bold text-theme mb-2 lg:mb-3">{blog.title}</h3>
                                                    <p className="text-sm lg:text-base text-theme-muted line-clamp-3">
                                                        {blog.excerpt || blog.content.substring(0, 150) + '...'}
                                                    </p>
                                                    <div className="mt-3 lg:mt-4 text-theme-purple text-xs lg:text-sm font-semibold">
                                                        Klik voor meer details →
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-6">
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
                                    {(() => {
                                        const d = selectedBlog.updated_at || selectedBlog.created_at || null;
                                        return d && !isNaN(new Date(d).getTime()) ? format(new Date(d), 'd MMMM yyyy', { locale: nl }) : '—';
                                    })()}
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
