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
    jobTitle: string;
    birthday?: string;
    customSecurityAttributes?: {
        SalveMundiLidmaatschap?: {
            VerloopdatumStr?: string;
            Verloopdatum?: string;
            Geboortedatum?: string;
            OrigineleBetaalDatumStr?: string;
        }
    }
}

export interface AzureGroup {
    id: string;
    displayName: string;
}

export class GraphService {
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
        
        try {
            console.log(`[GraphService] Sending request to /users...`);
            let response = await client.api('/users')
                .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,jobTitle')
                .top(999)
                .get();

            console.log(`[GraphService] Received response from /users. Count: ${response.value?.length}`);
            allUsers = [...(response.value || [])];

            while (response['@odata.nextLink']) {
                console.log(`[GraphService] Fetching next page...`);
                response = await client.api(response['@odata.nextLink']).get();
                allUsers = [...allUsers, ...response.value];
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
        const response = await this.getClient(token).api(`/groups/${groupId}/owners`)
            .select('id')
            .get();
        return (response.value || []).map((o: any) => o.id);
    }
}
