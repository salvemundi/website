export interface Sponsor {
    id: number;
    // Directus may return a file id string or a file object; accept both
    image: string | { id: string; [key: string]: any } | null;
    website_url: string;
}
