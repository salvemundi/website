import { safeConsoleError, logInfo } from '../utils/logger.js';
import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphClient } from '../config/azure.js';

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
    static async getUser(userId: string): Promise<AzureUser> {
        return await this.getClient().api(`/users/${userId}`)
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle,customSecurityAttributes,birthday')
            .get() as AzureUser;
    }

    static async getUserByEmail(email: string): Promise<AzureUser | null> {
        const response = await this.getClient().api('/users')
            .filter(`mail eq '${email}' or userPrincipalName eq '${email}'`)
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle,customSecurityAttributes,birthday')
            .get() as { value?: AzureUser[] };
        return response.value?.[0] || null;
    }

    private static getClient(): Client {
        return getGraphClient();
    }

    static async getAllUsers(): Promise<AzureUser[]> {
        logInfo(`[graph.service.ts][getAllUsers] getAllUsers started`);
        let allUsers: AzureUser[];
        const client = this.getClient();

        const fetchWithRetry = async (url: string, selectFields?: string, top: number = 100, retries = 3): Promise<unknown> => {
            const isFullUrl = url.startsWith('http');
            for (let i = 0; i < retries; i++) {
                try {
                    let request = client.api(url);
                    if (!isFullUrl) {
                        if (selectFields) request = request.select(selectFields);
                        request = request.top(top);
                    }
                    return await request.get();
                } catch (error: unknown) {
                    if (i === retries - 1) throw error;
                    const delay = Math.pow(2, i) * 1000;
                    const statusCode = (error as { statusCode?: number }).statusCode || 500;
                    safeConsoleError(`[graph.service.ts][getAllUsers] Request failed (Status ${statusCode}), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            throw new Error('Fetch failed after retries');
        };

        try {
            const selectFields = 'id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle,customSecurityAttributes';
            logInfo(`[graph.service.ts][getAllUsers] Fetching users (page 1)...`);
            let response = await fetchWithRetry('/users', selectFields, 100) as Record<string, unknown>;

            logInfo(`[graph.service.ts][getAllUsers] Received response from /users. Count: ${(response.value as unknown[] | undefined)?.length}`);
            allUsers = [...((response.value as AzureUser[] | undefined) || [])];

            let page = 1;
            while (response['@odata.nextLink']) {
                page++;
                logInfo(`[graph.service.ts][getAllUsers] Fetching users (page ${page})...`);
                response = await fetchWithRetry(response['@odata.nextLink'] as string, undefined, 100) as Record<string, unknown>;
                allUsers = [...allUsers, ...((response.value as AzureUser[] | undefined) || [])];
            }

            return allUsers;
        } catch (error: unknown) {
            safeConsoleError(`[graph.service.ts][getAllUsers] Error in getAllUsers:`, JSON.stringify(error, null, 2));
            throw error;
        }
    }

    static async getUserGroups(userId: string): Promise<AzureGroup[]> {
        const response = await this.getClient().api(`/users/${userId}/memberOf/microsoft.graph.group`)
            .select('id,displayName')
            .get() as { value?: AzureGroup[] };
        return response.value || [];
    }

    static async getGroupOwners(groupId: string): Promise<string[]> {
        try {
            const response = await this.getClient().api(`/groups/${groupId}/owners`)
                .select('id')
                .get() as { value?: { id: string }[] };
            return (response.value || []).map(o => o.id);
        } catch (error: unknown) {
            const err = error as { statusCode?: number; message?: string };
            if (err.statusCode === 403 || err.message?.includes('Insufficient privileges')) {
                safeConsoleError(`[graph.service.ts][getGroupOwners] Insufficient privileges to read owners of group ${groupId}. Returning empty list.`);
                return [];
            }
            throw error;
        }
    }

    static async getBatchGroupDetails(groupIds: string[]): Promise<Map<string, { members: string[], owners: string[] }>> {
        const result = new Map<string, { members: string[], owners: string[] }>();
        const client = this.getClient();

        for (const id of groupIds) {
            try {
                let members: string[] = [];
                let response = await client.api(`/groups/${id}/members`).select('id').top(999).get() as Record<string, unknown>;
                members = [...((response.value as { id: string }[] | undefined) || []).map(m => m.id)];

                while (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink'] as string).get() as Record<string, unknown>;
                    members = [...members, ...((response.value as { id: string }[] | undefined) || []).map(m => m.id)];
                }

                const owners = await this.getGroupOwners(id);

                result.set(id, { members, owners });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                safeConsoleError(`[graph.service.ts][getBatchGroupDetails] Failed to fetch details for group ${id}:`, message);
                result.set(id, { members: [], owners: [] });
            }
        }

        return result;
    }

    static async getUserPhotosBatch(userIds: string[]): Promise<Map<string, { buffer: Buffer; contentType: string } | null>> {
        const result = new Map<string, { buffer: Buffer; contentType: string } | null>();
        const client = this.getClient();

        for (let i = 0; i < userIds.length; i += 20) {
            const batchIds = userIds.slice(i, i + 20);
            const requests = batchIds.map(id => ({
                id: id,
                method: 'GET',
                url: `/users/${id}/photo/$value`
            }));

            try {
                const batchResponse = await client.api('/$batch').post({ requests }) as {
                    responses: { id: string; status: number; body: string; headers?: Record<string, string> }[];
                };

                for (const res of batchResponse.responses) {
                    if (res.status === 200) {
                        const buffer = Buffer.from(res.body, 'base64');
                        const contentType = res.headers?.['Content-Type'] || 'image/jpeg';
                        result.set(res.id, { buffer, contentType });
                    } else {
                        result.set(res.id, null);
                    }
                }
            } catch (error) {
                safeConsoleError(`[graph.service.ts][getUserPhotosBatch] Batch photo fetch failed:`, error);
                batchIds.forEach(id => { if (!result.has(id)) result.set(id, null); });
            }
        }

        return result;
    }

    static async getUserPhoto(userId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
        try {
            const response = await this.getClient().api(`/users/${userId}/photo/$value`).get();
            if (!response) return null;
            const buffer = Buffer.from(response);
            const contentType = 'image/jpeg';
            return { buffer, contentType };
        } catch (error) {
            safeConsoleError(`[graph.service.ts][getUserPhoto] Error fetching photo for user ${userId}:`, error);
            return null;
        }
    }
}