// OG-image route voor de intro blog detailpagina
import { generateGradientOGImage } from '@/lib/utils/og-utils';
import { getIntroBlogBySlug } from '@/server/actions/public/intro.actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const blog = await getIntroBlogBySlug(slug);
    
    const title = blog?.title || 'Blog';
    const desc = blog?.excerpt || 'Lees de nieuwste updates over de Salve Mundi introductie.';
    const description = desc.length > 100 ? desc.substring(0, 100) + '...' : desc;

    return generateGradientOGImage({
        title: title,
        subtitle: description,
        category: 'Intro Blog'
    });
}
