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

        // 0. Idempotency Check: Verify if user already liked it
        const query = new URLSearchParams({
            'filter[blog_id][_eq]': String(blogId),
            'filter[user_id][_eq]': String(user.id)
        }).toString();
        const existingLike = await serverDirectusFetch<any[]>(`/items/blog_likes?${query}`);

        // 1. Get current likes
        const blog = await serverDirectusFetch<any>(`/items/intro_blogs/${blogId}?fields=likes`);
        if (!blog) return { success: false, error: 'Blog niet gevonden.' };

        const currentLikes = blog.likes || 0;

        if (existingLike && existingLike.length > 0) {
            // ALREADY LIKED: Return success without mutating
            return { success: true, likes: currentLikes };
        }

        const newLikes = currentLikes + 1;

        // 2. Track that THIS user liked it FIRST (so if it fails, we don't increment)
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
            // If the insert failed (e.g., race condition unique constraint), it's likely already liked
            return { success: true, likes: currentLikes };
        }

        // 3. Update likes in blog securely using mutatedirectus via patch
        await mutateDirectus(
            `/items/intro_blogs/${blogId}`,
            'PATCH',
            { likes: newLikes }
        );

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

        // 0. Idempotency Check: Verify if the user like actually exists
        const query = new URLSearchParams({
            'filter[blog_id][_eq]': String(blogId),
            'filter[user_id][_eq]': String(user.id)
        }).toString();
        const existingLike = await serverDirectusFetch<any[]>(`/items/blog_likes?${query}`);

        const blog = await serverDirectusFetch<any>(`/items/intro_blogs/${blogId}?fields=likes`);
        if (!blog) return { success: false, error: 'Blog niet gevonden.' };

        const currentLikes = blog.likes || 0;

        if (!existingLike || existingLike.length === 0) {
            // ALREADY UNLIKED: Return success without mutating
            return { success: true, likes: currentLikes };
        }

        // Remove from tracking FIRST
        try {
            await mutateDirectus(
                `/items/blog_likes/${existingLike[0].id}`,
                'DELETE'
            );
        } catch (e) {
            // assume it's already deleted if it fails
        }

        const newLikes = Math.max(0, currentLikes - 1);

        // Update likes securely
        await mutateDirectus(
            `/items/intro_blogs/${blogId}`,
            'PATCH',
            { likes: newLikes }
        );

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
