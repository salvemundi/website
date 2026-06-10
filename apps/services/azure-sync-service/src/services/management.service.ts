import 'isomorphic-fetch';
import { logInfo } from '../utils/logger.js';

export class ManagementService {
    private static getConfig() {
        const baseUrl = process.env.AZURE_MANAGEMENT_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:3004';
        const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
        return { baseUrl, token };
    }

    static async addGroupMember(groupId: string, userId: string): Promise<void> {
        const { baseUrl, token } = this.getConfig();
        logInfo(`[ManagementService] Delegating addGroupMember(group: ${groupId}, user: ${userId}) to ${baseUrl}`);

        const response = await fetch(`${baseUrl}/api/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
            const errorMessage = typeof body.error === 'string' ? body.error : response.statusText;
            throw new Error(`Management Service error: ${errorMessage}`);
        }
    }

    static async removeGroupMember(groupId: string, userId: string): Promise<void> {
        const { baseUrl, token } = this.getConfig();
        logInfo(`[ManagementService] Delegating removeGroupMember(group: ${groupId}, user: ${userId}) to ${baseUrl}`);

        const response = await fetch(`${baseUrl}/api/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
            const errorMessage = typeof body.error === 'string' ? body.error : response.statusText;
            throw new Error(`Management Service error: ${errorMessage}`);
        }
    }
}