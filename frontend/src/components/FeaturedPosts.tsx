'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getImageUrl } from '@/shared/lib/api/salvemundi';

export interface PostPreview {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  readTime?: string;
  tags?: string[];
}

export interface FeaturedPostsProps {
  posts: PostPreview[];
  layout?: 'grid' | 'list' | 'carousel';
  onPostClick?: (post: PostPreview) => void;
  maxPosts?: number;
}

export default function FeaturedPosts({
  posts,
  layout = 'grid',
  onPostClick,
  maxPosts,
}: FeaturedPostsProps) {
  const displayedPosts = maxPosts ? posts.slice(0, maxPosts) : posts;

  if (displayedPosts.length === 0) {
    return null;
  }

  const layoutClass = {
    grid: 'grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3',
    list: 'flex flex-col gap-4 sm:gap-6',
    carousel: 'flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4',
  }[layout];

  return (
    <div className="w-full">
      <div className={layoutClass}>
        {displayedPosts.map((post) => (console.debug('[featured.post.render]', { id: post.id, created_at: post.created_at, updated_at: post.updated_at }), (
          <article
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className={`bg-[var(--bg-card)] rounded-xl lg:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
              onPostClick ? 'cursor-pointer' : ''
            } ${layout === 'carousel' ? 'snap-start flex-shrink-0 w-80' : ''}`}
          >
            {/* Image */}
            {post.image && (
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img
                  src={getImageUrl(post.image)}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            {!post.image && (
              <div className="relative h-40 sm:h-48 bg-gradient-theme" />
            )}

            {/* Content */}
            <div className="p-4 lg:p-6">
              <div className="flex items-center gap-3 text-xs lg:text-sm text-theme-muted mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                  {(() => {
                    const d = post.updated_at || post.created_at || null;
                    return d && !isNaN(new Date(d).getTime()) ? format(new Date(d), 'd MMM yyyy', { locale: nl }) : '—';
                  })()}
                </div>
                {post.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                    {post.readTime}
                  </div>
                )}
              </div>

              <h3 className="text-lg lg:text-xl font-bold text-theme mb-2 lg:mb-3 line-clamp-2">
                {post.title}
              </h3>

              {post.excerpt && (
                <p className="text-sm lg:text-base text-theme-muted line-clamp-3 mb-3">
                  {post.excerpt}
                </p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-theme-purple/10 text-theme-purple rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {onPostClick && (
                <div className="mt-3 lg:mt-4 text-theme-purple text-xs lg:text-sm font-semibold">
                  Lees meer →
                </div>
              )}
            </div>
          </article>
        ))) }
      </div>
    </div>
  );
}
