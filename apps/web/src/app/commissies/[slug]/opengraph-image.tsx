import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Commissie Details - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export default async function Image({ params }: { params: { slug: string } }) {
    const slug = params.slug;

    try {
        // Fetch committee data
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const apiKey = process.env.DIRECTUS_API_TOKEN || process.env.DIRECTUS_API_KEY || '';

        const committeesResponse = await fetch(
            `${directusUrl}/items/committees?fields=id,name,short_description,is_visible&sort=name`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!committeesResponse.ok) {
            throw new Error('Failed to fetch committees');
        }

        const committeesData = await committeesResponse.json();
        const committees = committeesData.data;

        // Find committee by slug
        const committee = committees.find(
            (c: any) => slugify(cleanCommitteeName(c.name)) === slug
        );

        if (!committee) {
            // Return default OG image if committee not found
            return generateOGImage({
                title: 'Commissie',
                description: 'Commissie details - Salve Mundi',
                category: 'Ontwikkeling',
            });
        }

        const cleanName = cleanCommitteeName(committee.name);

        return generateOGImage({
            title: cleanName,
            description: committee.short_description || 'Een van onze actieve commissies bij Salve Mundi',
            category: 'Commissie',
        });
    } catch (error) {
        console.error('Error generating committee OG image:', error);

        // Fallback OG image
        return generateOGImage({
            title: 'Commissies',
            description: 'Ontdek onze commissies bij Salve Mundi',
            category: 'Ontwikkeling',
        });
    }
}
