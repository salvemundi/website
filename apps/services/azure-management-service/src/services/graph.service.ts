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

    /**
     * Creates a new user in Microsoft Entra ID.
     */
    static async createUser(
        email: string, 
        firstName: string, 
        lastName: string, 
        token: string,
        phoneNumber?: string,
        dateOfBirth?: string
    ) {
        const client = this.getClient(token);
        
        // Generate a cryptographically secure temporary password
        const randomPart = crypto.randomUUID().split('-')[0];
        const specialPart = crypto.randomUUID().split('-')[1].toUpperCase();
        const tempPassword = `SM-${randomPart}!${specialPart}#`;
        
        const user: any = {
            accountEnabled: true,
            displayName: `${firstName} ${lastName}`,
            mailNickname: email.split('@')[0],
            userPrincipalName: email,
            passwordProfile: {
                forceChangePasswordNextSignIn: true,
                password: tempPassword
            }
        };

        // Add Custom Security Attributes if provided
        if (phoneNumber || dateOfBirth) {
            user.customSecurityAttributes = {
                SalveMundiLidmaatschap: {
                    "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue",
                }
            };
            if (phoneNumber) user.customSecurityAttributes.SalveMundiLidmaatschap.Telefoon = phoneNumber;
            if (dateOfBirth) {
                // Ensure date format is YYYYMMDD for Azure if needed, or stick to what SyncJob expects
                const cleanDob = dateOfBirth.replace(/-/g, '');
                user.customSecurityAttributes.SalveMundiLidmaatschap.Geboortedatum = cleanDob;
            }
        }

        const result = await client.api('/users').post(user);
        
        return {
            ...result,
            temporaryPassword: tempPassword
        };
    }

    /**
     * Updates an existing user in Microsoft Entra ID.
     */
    static async updateUser(
        entraId: string,
        token: string,
        data: {
            displayName?: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            membershipExpiry?: string;
            originalPaymentDate?: string;
        }
    ) {
        const client = this.getClient(token);
        const payload: any = {};

        if (data.displayName) payload.displayName = data.displayName;

        if (data.phoneNumber || data.dateOfBirth || data.membershipExpiry || data.originalPaymentDate) {
            payload.customSecurityAttributes = {
                SalveMundiLidmaatschap: {
                    "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue",
                }
            };
            if (data.phoneNumber) payload.customSecurityAttributes.SalveMundiLidmaatschap.Telefoon = data.phoneNumber;
            if (data.dateOfBirth) {
                const cleanDob = data.dateOfBirth.replace(/-/g, '');
                payload.customSecurityAttributes.SalveMundiLidmaatschap.Geboortedatum = cleanDob;
            }
            if (data.membershipExpiry) {
                const cleanExpiry = data.membershipExpiry.replace(/-/g, '');
                payload.customSecurityAttributes.SalveMundiLidmaatschap.VerloopdatumStr = cleanExpiry;
            }
            if (data.originalPaymentDate) {
                const cleanPaidDate = data.originalPaymentDate.replace(/-/g, '');
                payload.customSecurityAttributes.SalveMundiLidmaatschap.OrigineleBetaalDatumStr = cleanPaidDate;
            }
        }

        return await client.api(`/users/${entraId}`).update(payload);
    }
}
