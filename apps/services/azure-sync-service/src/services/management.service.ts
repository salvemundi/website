import 'isomorphic-fetch';
import { logInfo } from '../utils/logger.js';

export class ManagementService {
    private static get baseUrl() {
        return process.env.AZURE_MANAGEMENT_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:3004';
    }

    private static get token() {
        return process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
    }

    /**
     * Delegates group member addition to the management service.
     */
    static async addGroupMember(groupId: string, userId: string): Promise<void> {
        logInfo(`[ManagementService] Delegating addGroupMember(group: ${groupId}, user: ${userId}) to ${this.baseUrl}`);
        
        const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
            const errorMessage = typeof body.error === 'string' ? body.error : response.statusText;
            throw new Error(`Management Service error: ${errorMessage}`);
        }
    }

    /**
     * Delegates group member removal to the management service.
     */
    static async removeGroupMember(groupId: string, userId: string): Promise<void> {
        logInfo(`[ManagementService] Delegating removeGroupMember(group: ${groupId}, user: ${userId}) to ${this.baseUrl}`);

        const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
            const errorMessage = typeof body.error === 'string' ? body.error : response.statusText;
            throw new Error(`Management Service error: ${errorMessage}`);
        }
    }
}
