import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import crypto from 'crypto';

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
        upn: string,
        firstName: string,
        lastName: string,
        token: string,
        personalEmail: string,
        phoneNumber?: string,
        dateOfBirth?: string,
        originalPaymentDate?: string,
        membershipExpiry?: string
    ) {
        const client = this.getClient(token);

        // Generate a cryptographically secure temporary password
        const randomPart = crypto.randomUUID().split('-')[0];
        const specialPart = crypto.randomUUID().split('-')[1].toUpperCase();
        const tempPassword = `SM-${randomPart}!${specialPart}#`;

        const user: any = {
            accountEnabled: true,
            displayName: `${firstName} ${lastName}`,
            mailNickname: upn.split('@')[0],
            userPrincipalName: upn,
            otherMails: [personalEmail],
            mail: upn, // Set primary mail to the new UPN
            passwordProfile: {
                forceChangePasswordNextSignIn: true,
                password: tempPassword
            }
        };

        if (phoneNumber) user.mobilePhone = phoneNumber;

        // Add Custom Security Attributes if provided
        if (dateOfBirth || originalPaymentDate || membershipExpiry) {
            user.customSecurityAttributes = {
                SalveMundiLidmaatschap: {
                    "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue",
                }
            };
            if (dateOfBirth) {
                const cleanDob = dateOfBirth.replace(/-/g, '');
                user.customSecurityAttributes.SalveMundiLidmaatschap.Geboortedatum = cleanDob;
            }
            if (originalPaymentDate) {
                const cleanPaidDate = originalPaymentDate.replace(/-/g, '');
                user.customSecurityAttributes.SalveMundiLidmaatschap.OrigineleBetaalDatumStr = cleanPaidDate;
            }
            if (membershipExpiry) {
                const cleanExpiry = membershipExpiry.replace(/-/g, '');
                user.customSecurityAttributes.SalveMundiLidmaatschap.VerloopdatumStr = cleanExpiry;
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
        if (data.phoneNumber) payload.mobilePhone = data.phoneNumber;

        if (data.dateOfBirth || data.membershipExpiry || data.originalPaymentDate) {
            payload.customSecurityAttributes = {
                SalveMundiLidmaatschap: {
                    "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue",
                }
            };
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
