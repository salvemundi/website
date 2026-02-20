'use server';

import { serverDirectusFetch, mutateDirectus } from '@/shared/lib/server-directus';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { getServerSessionToken } from '@/shared/lib/auth-server';

/**
 * Handle liking a blog post
 */
export async function likeBlogAction(blogId: string | number): Promise<{ success: boolean; likes?: number; error?: string }> {
    try {
        const user = await getCurrentUserAction();
        if (!user) {
            return { success: false, error: 'Je moet ingelogd zijn om te liken.' };
        }

        // 1. Get current likes
        const blog = await serverDirectusFetch<any>(`/items/intro_blogs/${blogId}?fields=likes`);
        if (!blog) return { success: false, error: 'Blog niet gevonden.' };

        const currentLikes = blog.likes || 0;
        const newLikes = currentLikes + 1;

        // 2. Update likes in blog securely using mutatedirectus via patch
        await mutateDirectus(
            `/items/intro_blogs/${blogId}`,
            'PATCH',
            { likes: newLikes }
        );

        // 3. Track that THIS user liked it
        try {
            await mutateDirectus(
                '/items/blog_likes',
                'POST',
                {
                    blog_id: blogId,
                    user_id: user.id
                }
            );
        } catch (e) {
            // Might already exist or table doesn't exist, ignore for now as primary goal is the count
        }

        revalidatePath('/intro/blog');
        return { success: true, likes: newLikes };
    } catch (error: any) {
        console.error('likeBlogAction error:', error);
        return { success: false, error: 'Kon like niet verwerken.' };
    }
}

/**
 * Handle unliking a blog post
 */
export async function unlikeBlogAction(blogId: string | number): Promise<{ success: boolean; likes?: number; error?: string }> {
    try {
        // Use getCurrentUserAction to verify identity and impersonation securely
        const user = await getCurrentUserAction();
        if (!user) return { success: false, error: 'Niet geautoriseerd.' };

        const blog = await serverDirectusFetch<any>(`/items/intro_blogs/${blogId}?fields=likes`);
        if (!blog) return { success: false, error: 'Blog niet gevonden.' };

        const currentLikes = blog.likes || 0;
        const newLikes = Math.max(0, currentLikes - 1);

        // Update likes securely
        await mutateDirectus(
            `/items/intro_blogs/${blogId}`,
            'PATCH',
            { likes: newLikes }
        );

        // Remove from tracking
        try {
            const query = new URLSearchParams({
                'filter[blog_id][_eq]': String(blogId),
                'filter[user_id][_eq]': user.id
            }).toString();

            const existing = await serverDirectusFetch<any[]>(`/items/blog_likes?${query}`);
            if (existing && existing.length > 0) {
                // Delete the like securely
                await mutateDirectus(
                    `/items/blog_likes/${existing[0].id}`,
                    'DELETE'
                );
            }
        } catch (e) {
            // ignore
        }

        revalidatePath('/intro/blog');
        return { success: true, likes: newLikes };
    } catch (error: any) {
        console.error('unlikeBlogAction error:', error);
        return { success: false, error: 'Kon unlike niet verwerken.' };
    }
}

/**
 * Send intro update email
 */
export async function sendIntroUpdateAction(blogData: any): Promise<{ success: boolean; data?: { sentCount?: number }; error?: string }> {
    try {
        const token = await getServerSessionToken();
        if (!token) return { success: false, error: 'Niet geautoriseerd.' };

        // Even though this uses the proxy endpoint, for proxy endpoints mutateDirectus expects JSON endpoints.
        // It's safer to use mutateDirectus here to inherit standard mutation configurations
        const response = await mutateDirectus<{ sentCount?: number }>(
            '/intro/send-update',
            'POST',
            blogData
        );

        return { success: true, data: response };
    } catch (error: any) {
        console.error('sendIntroUpdateAction error:', error);
        return { success: false, error: 'Kon email niet versturen.' };
    }
}
