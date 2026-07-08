import { safeConsoleError } from '../utils/logger.js';
import { Client } from '@microsoft/microsoft-graph-client';
import crypto from 'crypto';

interface UserPayload {
    accountEnabled?: boolean;
    displayName?: string;
    givenName?: string;
    surname?: string;
    mailNickname?: string;
    userPrincipalName?: string;
    otherMails?: string[];
    mail?: string;
    passwordProfile?: {
        forceChangePasswordNextSignIn: boolean;
        password: string;
    };
    mobilePhone?: string;
    customSecurityAttributes?: {
        SalveMundiLidmaatschap: {
            "@odata.type": string;
            Geboortedatum?: string;
            VerloopdatumStr?: string;
            OrigineleBetaalDatumStr?: string;
        };
    };
}

export class GraphService {
    private static getClient(token: string): Client {
        return Client.init({
            authProvider: (done: (error: Error | null, token: string | null) => void) => {
                done(null, token);
            }
        });
    }

    static async addGroupMember(groupId: string, memberId: string, token: string): Promise<unknown> {
        const client = this.getClient(token);
        const memberUrl = `https://graph.microsoft.com/v1.0/directoryObjects/${memberId}`;

        return await client.api(`/groups/${groupId}/members/$ref`)
            .post({
                "@odata.id": memberUrl
            });
    }

    static async removeGroupMember(groupId: string, memberId: string, token: string): Promise<unknown> {
        const client = this.getClient(token);
        return await client.api(`/groups/${groupId}/members/${memberId}/$ref`)
            .delete();
    }

    static async addGroupOwner(groupId: string, ownerId: string, token: string): Promise<unknown> {
        const client = this.getClient(token);
        const ownerUrl = `https://graph.microsoft.com/v1.0/directoryObjects/${ownerId}`;

        return await client.api(`/groups/${groupId}/owners/$ref`)
            .post({
                "@odata.id": ownerUrl
            });
    }

    static async removeGroupOwner(groupId: string, ownerId: string, token: string): Promise<unknown> {
        const client = this.getClient(token);
        return await client.api(`/groups/${groupId}/owners/${ownerId}/$ref`)
            .delete();
    }

    static async generateUniqueUpn(baseName: string, token: string, domain: string = 'lid.salvemundi.nl'): Promise<string> {
        const client = this.getClient(token);
        let candidateUpn = `${baseName}@${domain}`;
        let counter = 0;

        for (;;) {
            if (counter > 0) {
                candidateUpn = `${baseName}${counter}@${domain}`;
            }

            try {
                const response = await client.api('/users')
                    .filter(`userPrincipalName eq '${candidateUpn}'`)
                    .select('id')
                    .get() as { value?: unknown[] };

                if (!response.value || response.value.length === 0) {
                    return candidateUpn;
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                safeConsoleError(`[graph.service.ts][generateUniqueUpn] Error verifying UPN ${candidateUpn}:`, errorMessage);
                throw error;
            }

            counter++;
        }
    }

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

        const randomPart = crypto.randomUUID().split('-')[0];
        const specialPart = crypto.randomUUID().split('-')[1].toUpperCase();
        const tempPassword = `SM-${randomPart}!${specialPart}#`;

        const user: UserPayload = {
            accountEnabled: true,
            displayName: `${firstName} ${lastName}`,
            givenName: firstName,
            surname: lastName,
            mailNickname: upn.split('@')[0],
            userPrincipalName: upn,
            otherMails: [personalEmail],
            mail: upn,
            passwordProfile: {
                forceChangePasswordNextSignIn: true,
                password: tempPassword
            }
        };

        if (phoneNumber) user.mobilePhone = phoneNumber;

        if (dateOfBirth || originalPaymentDate || membershipExpiry) {
            const attributes: {
                "@odata.type": string;
                Geboortedatum?: string;
                OrigineleBetaalDatumStr?: string;
                VerloopdatumStr?: string;
            } = {
                "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue"
            };
            if (dateOfBirth) {
                attributes.Geboortedatum = dateOfBirth.replace(/-/g, '');
            }
            if (originalPaymentDate) {
                attributes.OrigineleBetaalDatumStr = originalPaymentDate.replace(/-/g, '');
            }
            if (membershipExpiry) {
                attributes.VerloopdatumStr = membershipExpiry.replace(/-/g, '');
            }
            user.customSecurityAttributes = {
                SalveMundiLidmaatschap: attributes
            };
        }

        const result = await client.api('/users').post(user) as { id?: string | number; userPrincipalName?: string } & Record<string, unknown>;

        return {
            ...result,
            id: String(result.id ?? ''),
            userPrincipalName: String(result.userPrincipalName ?? ''),
            temporaryPassword: tempPassword
        };
    }

    static async updateUser(
        entraId: string,
        token: string,
        data: {
            displayName?: string;
            givenName?: string;
            surname?: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            membershipExpiry?: string;
            originalPaymentDate?: string;
        }
    ): Promise<unknown> {
        const client = this.getClient(token);
        const payload: UserPayload = {};

        if (data.displayName) payload.displayName = data.displayName;
        if (data.givenName) payload.givenName = data.givenName;
        if (data.surname) payload.surname = data.surname;
        if (data.phoneNumber) payload.mobilePhone = data.phoneNumber;

        if (data.dateOfBirth || data.membershipExpiry || data.originalPaymentDate) {
            const attributes: {
                "@odata.type": string;
                Geboortedatum?: string;
                VerloopdatumStr?: string;
                OrigineleBetaalDatumStr?: string;
            } = {
                "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue"
            };
            if (data.dateOfBirth) {
                attributes.Geboortedatum = data.dateOfBirth.replace(/-/g, '');
            }
            if (data.membershipExpiry) {
                attributes.VerloopdatumStr = data.membershipExpiry.replace(/-/g, '');
            }
            if (data.originalPaymentDate) {
                attributes.OrigineleBetaalDatumStr = data.originalPaymentDate.replace(/-/g, '');
            }
            payload.customSecurityAttributes = {
                SalveMundiLidmaatschap: attributes
            };
        }

        return await client.api(`/users/${entraId}`).update(payload);
    }

    static async getUserGroups(entraId: string, token: string): Promise<unknown[]> {
        const client = this.getClient(token);
        const response = await client.api(`/users/${entraId}/memberOf`).select('id,displayName').get() as { value?: unknown[] };
        return response.value || [];
    }

    static async updateUserPhoto(entraId: string, photo: Buffer, token: string): Promise<unknown> {
        const client = this.getClient(token);
        return await client.api(`/users/${entraId}/photo/$value`)
            .header('Content-Type', 'image/jpeg')
            .put(photo);
    }
}