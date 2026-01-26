export interface Sponsor {
    id: number;
    // Directus may return a file id string or a file object; accept both
    image: string | { id: string; [key: string]: any } | null;
    website_url: string;
    // If true, this sponsor prefers a dark card/background regardless of theme
    dark_bg?: boolean;
}
