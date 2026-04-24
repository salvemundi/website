import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export interface AzureUser {
    id: string;
    displayName: string;
    givenName: string;
    surname: string;
    mail: string;
    userPrincipalName: string;
    mobilePhone: string;
    businessPhones: string[];
    jobTitle: string;
    birthday?: string;
    customSecurityAttributes?: {
        SalveMundiLidmaatschap?: {
            VerloopdatumStr?: string;
            Verloopdatum?: string;
            Geboortedatum?: string;
            OrigineleBetaalDatumStr?: string;
            OrigineleBetaalDatum?: string;
        }
    }
}

export interface AzureGroup {
    id: string;
    displayName: string;
}

export class GraphService {
    static async getUser(userId: string, token: string): Promise<AzureUser> {
        return await this.getClient(token).api(`/users/${userId}`)
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle,customSecurityAttributes,birthday')
            .get();
    }

    static async getUserByEmail(email: string, token: string): Promise<AzureUser | null> {
        const response = await this.getClient(token).api('/users')
            .filter(`mail eq '${email}' or userPrincipalName eq '${email}'`)
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle,customSecurityAttributes,birthday')
            .get();
        return response.value?.[0] || null;
    }

    private static getClient(token: string): Client {
        return Client.init({
            authProvider: (done) => {
                done(null, token);
            }
        });
    }

    static async getAllUsers(token: string): Promise<AzureUser[]> {
        console.log(`[GraphService] getAllUsers started`);
        let allUsers: AzureUser[] = [];
        const client = this.getClient(token);
        
        const fetchWithRetry = async (url: string, selectFields?: string, top: number = 100, retries = 3): Promise<any> => {
            for (let i = 0; i < retries; i++) {
                try {
                    let request = client.api(url);
                    if (selectFields) request = request.select(selectFields);
                    return await request.top(top).get();
                } catch (err: any) {
                    if (i === retries - 1) throw err;
                    const delay = Math.pow(2, i) * 1000;
                    console.warn(`[GraphService] Request failed (Status ${err.statusCode}), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        };

        try {
            const selectFields = 'id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle,customSecurityAttributes';
            console.log(`[GraphService] Fetching users (page 1)...`);
            let response = await fetchWithRetry('/users', selectFields, 100);

            console.log(`[GraphService] Received response from /users. Count: ${response.value?.length}`);
            allUsers = [...(response.value || [])];

            let page = 1;
            while (response['@odata.nextLink']) {
                page++;
                console.log(`[GraphService] Fetching users (page ${page})...`);
                response = await fetchWithRetry(response['@odata.nextLink'], undefined, 100);
                allUsers = [...allUsers, ...(response.value || [])];
            }

            return allUsers;
        } catch (error: any) {
            console.error(`[GraphService] Error in getAllUsers:`, JSON.stringify(error, null, 2));
            throw error;
        }
    }

    static async getUserGroups(userId: string, token: string): Promise<AzureGroup[]> {
        const response = await this.getClient(token).api(`/users/${userId}/memberOf/microsoft.graph.group`)
            .select('id,displayName')
            .get();
        return response.value || [];
    }

    static async getGroupOwners(groupId: string, token: string): Promise<string[]> {
        try {
            const response = await this.getClient(token).api(`/groups/${groupId}/owners`)
                .select('id')
                .get();
            return (response.value || []).map((o: any) => o.id);
        } catch (err: any) {
            if (err.statusCode === 403 || err.message?.includes('Insufficient privileges')) {
                console.warn(`[GraphService] Insufficient privileges to read owners of group ${groupId}. Returning empty list.`);
                return [];
            }
            throw err;
        }
    }

    /**
     * Fetches members and owners for multiple groups in batches to minimize round-trips.
     * Uses Microsoft Graph JSON Batching.
     */
    static async getBatchGroupDetails(groupIds: string[], token: string): Promise<Map<string, { members: string[], owners: string[] }>> {
        const result = new Map<string, { members: string[], owners: string[] }>();
        const client = this.getClient(token);

        // Process in batches of 10 groups (each group needs 2 calls: members & owners)
        // Max 20 requests per batch in MS Graph
        for (let i = 0; i < groupIds.length; i += 10) {
            const batchIds = groupIds.slice(i, i + 10);
            const requests = batchIds.flatMap(id => [
                {
                    id: `${id}-members`,
                    method: 'GET',
                    url: `/groups/${id}/members?$select=id`
                },
                {
                    id: `${id}-owners`,
                    method: 'GET',
                    url: `/groups/${id}/owners?$select=id`
                }
            ]);

            const batchResponse = await client.api('/$batch').post({ requests });
            
            for (const id of batchIds) {
                const membersRes = batchResponse.responses.find((r: any) => r.id === `${id}-members`);
                const ownersRes = batchResponse.responses.find((r: any) => r.id === `${id}-owners`);

                if (membersRes?.status === 403) {
                    console.warn(`[GraphService] Batch: Insufficient privileges to read members for group ${id}`);
                }
                if (ownersRes?.status === 403) {
                    console.warn(`[GraphService] Batch: Insufficient privileges to read owners for group ${id}`);
                }

                result.set(id, {
                    members: (membersRes?.body?.value || []).map((m: any) => m.id),
                    owners: (ownersRes?.body?.value || []).map((o: any) => o.id)
                });
            }
        }

        return result;
    }

    /**
     * Fetches profile photos for multiple users in a single batch request.
     * Note: Returns null if no photo exists for a user.
     */
    static async getUserPhotosBatch(userIds: string[], token: string): Promise<Map<string, { buffer: Buffer; contentType: string } | null>> {
        const result = new Map<string, { buffer: Buffer; contentType: string } | null>();
        const client = this.getClient(token);

        // MS Graph batch limit is 20 requests
        for (let i = 0; i < userIds.length; i += 20) {
            const batchIds = userIds.slice(i, i + 20);
            const requests = batchIds.map(id => ({
                id: id,
                method: 'GET',
                url: `/users/${id}/photo/$value`
            }));

            try {
                const batchResponse = await client.api('/$batch').post({ requests });
                
                for (const res of batchResponse.responses) {
                    if (res.status === 200) {
                        const buffer = Buffer.from(res.body, 'base64');
                        const contentType = res.headers?.['Content-Type'] || 'image/jpeg';
                        result.set(res.id, { buffer, contentType });
                    } else {
                        result.set(res.id, null);
                    }
                }
            } catch (err) {
                console.error(`[GraphService] Batch photo fetch failed:`, err);
                // Fallback: fill remaining with nulls so we don't crash
                batchIds.forEach(id => { if (!result.has(id)) result.set(id, null); });
            }
        }

        return result;
    }

    /**
     * Fetches a user's profile photo binary data from Entra ID.
     */
    static async getUserPhoto(userId: string, token: string): Promise<{ buffer: Buffer; contentType: string } | null> {
        try {
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`Failed to fetch photo: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/jpeg';

            return { buffer, contentType };
        } catch (err) {
            console.error(`[GraphService] Error fetching photo for user ${userId}:`, err);
            return null;
        }
    }
}
