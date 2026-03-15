import type { Sponsor } from '@salvemundi/validations';

interface SponsorsSectionProps {
    sponsors: Sponsor[];
}

// Server Component — vervangt de legacy client-side SponsorsSection.
// Data wordt als prop ontvangen vanuit de parent page (getSponsors() Server Action).
// Oneindige scroll-animatie via pure CSS (sponsors.css in globals.css import-chain).
// De 20× duplicaat-array zorgt voor een naadloze loop zonder JavaScript.
export function SponsorsSection({ sponsors }: SponsorsSectionProps) {
    const hasSponsors = sponsors.length > 0;

    // 20× dupliceren voor een naadloze oneindige CSS scroll-animatie.
    // De animatie loopt van 0% naar -25% (van 20 kopieën, 5 zijn zichtbaar tegelijk).
    const duplicatedSponsors = Array.from({ length: 20 }, () => sponsors).flat();

    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden">
            {/* Sectie-header */}
            <div className="mx-auto max-w-app px-6">
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-purple-300)] mb-2">
                        Onze sponsors
                    </p>
                    <h2 className="text-2xl font-black text-[var(--text-main)] sm:text-3xl">
                        Zij maken het mogelijk
                    </h2>
                </div>
            </div>

            {/* Scrollende sponsor-balk of lege staat */}
            {!hasSponsors ? (
                <div className="mx-auto max-w-app px-6">
                    <p className="text-center text-sm text-[var(--text-muted)]">Binnenkort meer informatie over onze sponsors.</p>
                </div>
            ) : (
                <div className="sponsors-scroll-container">
                    <div className="sponsors-scroll-track">
                        {duplicatedSponsors.map((sponsor, index) => {
                            // Unieke key combineert sponsor_id én index voor deduplicatie
                            const key = `${sponsor.sponsor_id}-${index}`;

                            // Afbeelding-URL via interne Directus asset-proxy
                            const src = sponsor.image
                                ? `/api/assets/${sponsor.image}`
                                : '/img/newlogo.png';

                            // Per-sponsor achtergrondvoorkeur (dark_bg al genormaliseerd via Zod)
                            const cls = `sponsor-item ${sponsor.dark_bg ? 'sponsor-dark-bg' : 'sponsor-light-bg'}`;

                            return (
                                <a
                                    key={key}
                                    href={sponsor.website_url ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cls}
                                    aria-label={`Bezoek sponsor ${sponsor.website_url ?? ''}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt={sponsor.website_url ? `Sponsor: ${sponsor.website_url}` : 'Sponsor'}
                                        className="sponsor-logo"
                                        loading="lazy"
                                    />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
