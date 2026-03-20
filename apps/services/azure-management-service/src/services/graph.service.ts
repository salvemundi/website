import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export class GraphService {
    private static getClient(token: string): Client {
        return Client.init({
            authProvider: (done: (error: Error | null, token: string | null) => void) => {
                done(null, token);
            }
        });
    }

    /**
     * Adds a member to a group in Azure AD.
     * @param groupId The Entra ID of the group (committee).
     * @param memberId The Entra ID of the user.
     */
    static async addGroupMember(groupId: string, memberId: string, token: string) {
        const client = this.getClient(token);
        const memberUrl = `https://graph.microsoft.com/v1.0/directoryObjects/${memberId}`;
        
        return await client.api(`/groups/${groupId}/members/$ref`)
            .post({
                "@odata.id": memberUrl
            });
    }

    /**
     * Removes a member from a group in Azure AD.
     * @param groupId The Entra ID of the group.
     * @param memberId The Entra ID of the user.
     */
    static async removeGroupMember(groupId: string, memberId: string, token: string) {
        const client = this.getClient(token);
        return await client.api(`/groups/${groupId}/members/${memberId}/$ref`)
            .delete();
    }

    /**
     * Adds an owner to a group in Azure AD (Set Leader).
     */
    static async addGroupOwner(groupId: string, ownerId: string, token: string) {
        const client = this.getClient(token);
        const ownerUrl = `https://graph.microsoft.com/v1.0/directoryObjects/${ownerId}`;
        
        return await client.api(`/groups/${groupId}/owners/$ref`)
            .post({
                "@odata.id": ownerUrl
            });
    }

    /**
     * Removes an owner from a group in Azure AD (Unset Leader).
     */
    static async removeGroupOwner(groupId: string, ownerId: string, token: string) {
        const client = this.getClient(token);
        return await client.api(`/groups/${groupId}/owners/${ownerId}/$ref`)
            .delete();
    }
}
