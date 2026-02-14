'use server';

import { verifyUserPermissions } from './secure-check';
import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { revalidatePath } from 'next/cache';

/**
 * Example Action: Delete a committee member.
 * 
 * SECURITY:
 * This action is protected. Even if a hacker calls this function directly
 * with a valid ID, the `verifyUserPermissions` check will block them
 * if they are not in the ICT committee or the Board.
 */
export async function deleteCommitteeMemberAction(membershipId: number | string) {
    // 1. SECURITY CHECK (The Gatekeeper)
    // This runs strictly on the server. The user cannot manipulate this.
    await verifyUserPermissions({
        commissie_tokens: ['ictcommissie', 'bestuur']
    });

    console.log(`[AdminAction] User authorized. Deleting committee member ${membershipId}`);

    // 2. EXECUTION (The Power)
    // If we reach here, the user is authorized. We use the server's admin token
    // to perform the deletion in Directus.
    try {
        await serverDirectusFetch(`/items/committee_members/${membershipId}`, {
            method: 'DELETE',
        });

        // 3. REFRESH (The UI)
        revalidatePath('/admin/committees');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete member:', error);
        throw new Error('Kon lid niet verwijderen. Controleer de logs.');
    }
}

/**
 * Example Action: Update an intro blog post.
 * 
 * SECURITY:
 * Requires 'introcommissie' (content owner) OR 'ictcommissie' (tech support).
 */
export async function updateIntroBlogAction(blogId: string, data: any) {
    await verifyUserPermissions({
        commissie_tokens: ['introcommissie', 'ictcommissie', 'bestuur']
    });

    try {
        await serverDirectusFetch(`/items/intro_blogs/${blogId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        revalidatePath('/intro/nieuws');
        revalidatePath('/admin/intro');
        return { success: true };
    } catch (error) {
        throw new Error('Update mislukt.');
    }
}

/**
 * Example Action: Manage Sensitive Logging.
 * 
 * SECURITY:
 * Strictly requires ICT membership. Even the board ('bestuur') is excluded here
 * to enforce separation of concerns if needed (just as an example).
 */
export async function clearSystemLogsAction() {
    await verifyUserPermissions({
        commissie_tokens: ['ictcommissie']
    });

    // ... logic to clear logs ...
    return { success: true, message: 'Logs cleared' };
}
