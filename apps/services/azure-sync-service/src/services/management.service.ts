import 'isomorphic-fetch';

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
        console.log(`[ManagementService] Delegating addGroupMember(group: ${groupId}, user: ${userId}) to ${this.baseUrl}`);
        
        const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(`Management Service error: ${body.error || response.statusText}`);
        }
    }

    /**
     * Delegates group member removal to the management service.
     */
    static async removeGroupMember(groupId: string, userId: string): Promise<void> {
        console.log(`[ManagementService] Delegating removeGroupMember(group: ${groupId}, user: ${userId}) to ${this.baseUrl}`);

        const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(`Management Service error: ${body.error || response.statusText}`);
        }
    }
}
