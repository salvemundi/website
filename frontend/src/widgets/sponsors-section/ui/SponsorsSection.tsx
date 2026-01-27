"use client";

import { useEffect, useState } from 'react';
import { directusFetch } from '@/shared/lib/directus';
import { Sponsor } from '@/shared/model/types/sponsor';
import './sponsors-section.css';

export default function SponsorsSection() {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                setLoading(true);
                // Prefer server-side proxied public endpoint which uses a server API key
                const resp = await fetch('/api/public-sponsors');
                if (resp.ok) {
                    const data = await resp.json();
                    setSponsors(data || []);
                } else {
                    // Fallback to client directusFetch (for authenticated sessions)
                    const data = await directusFetch<Sponsor[]>('/items/sponsors');
                    setSponsors(data || []);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load sponsors');
                console.error('Error fetching sponsors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsors();
    }, []);

    // Sponsors state updates (no debug logging)
    useEffect(() => {
        // Intentionally left blank for future side-effects
    }, [sponsors]);

    if (loading) {
        return (
            <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden">
                <div className="mx-auto max-w-app px-6">
                    <div className="text-center mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-purple mb-2">
                            Onze sponsors
                        </p>
                        <h2 className="text-2xl font-black text-theme sm:text-3xl">
                            Zij maken het mogelijk
                        </h2>
                    </div>
                    <div className="flex justify-center items-center h-32">
                        <div className="text-theme-muted">Laden...</div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || sponsors.length === 0) {
        return null;
    }

    // Duplicate sponsors array multiple times to create seamless infinite loop
    // The more duplicates, the smoother the transition
    const duplicatedSponsors = [
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors,
        ...sponsors
    ];

    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden">
            <div className="mx-auto max-w-app px-6">
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-purple mb-2">
                        Onze sponsors
                    </p>
                    <h2 className="text-2xl font-black text-theme sm:text-3xl">
                        Zij maken het mogelijk
                    </h2>
                </div>
            </div>

            <div className="sponsors-scroll-container">
                <div className="sponsors-scroll-track">
                    {duplicatedSponsors.map((sponsor, index) => {
                        // Normalize id (Directus may return `sponsor_id`)
                        const sponsorKey = (sponsor as any).id ?? (sponsor as any).sponsor_id ?? index;

                        // Coerce any DB value to boolean (accept 1/"1"/true/"true")
                        const parseBool = (v: any) => {
                            if (v === true || v === 1) return true;
                            if (typeof v === 'string') {
                                const s = v.trim().toLowerCase();
                                return s === '1' || s === 'true' || s === 'yes' || s === 'y';
                            }
                            return false;
                        };

                        const forcedDark = parseBool((sponsor as any).dark_bg) || parseBool((sponsor as any).dark_Bg) || false;

                        // Decision computed for per-sponsor background (no debug logging)

                        const imageId = typeof sponsor.image === 'string'
                            ? sponsor.image
                            : sponsor.image && typeof sponsor.image === 'object'
                                ? sponsor.image.id
                                : null;
                        const src = imageId ? `/api/assets/${imageId}` : '/img/placeholder.png';

                        const cls = 'sponsor-item ' + (forcedDark ? 'sponsor-dark-bg' : 'sponsor-light-bg');

                        return (
                            <a
                                key={`${sponsorKey}-${index}`}
                                href={sponsor.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cls}
                            >
                                <img
                                    src={src}
                                    alt={sponsor.website_url || 'Sponsor'}
                                    className="sponsor-logo"
                                    loading="lazy"
                                />
                            </a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
