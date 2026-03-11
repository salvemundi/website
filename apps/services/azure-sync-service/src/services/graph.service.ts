import { getGraphClient } from '../config/azure.js';

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
    static async getAllUsers(): Promise<AzureUser[]> {
        let allUsers: AzureUser[] = [];
        let response = await getGraphClient().api('/users')
            .version('beta')
            .header('ConsistencyLevel', 'eventual')
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,customSecurityAttributes,jobTitle,birthday')
            .top(999)
            .get();

        allUsers = [...response.value];

        while (response['@odata.nextLink']) {
            response = await getGraphClient().api(response['@odata.nextLink']).get();
            allUsers = [...allUsers, ...response.value];
        }

        return allUsers;
    }

    static async getUserGroups(userId: string): Promise<AzureGroup[]> {
        const response = await getGraphClient().api(`/users/${userId}/memberOf/microsoft.graph.group`)
            .select('id,displayName')
            .get();
        return response.value || [];
    }

    static async getGroupOwners(groupId: string): Promise<string[]> {
        const response = await getGraphClient().api(`/groups/${groupId}/owners`)
            .select('id')
            .get();
        return (response.value || []).map((o: any) => o.id);
    }
}
