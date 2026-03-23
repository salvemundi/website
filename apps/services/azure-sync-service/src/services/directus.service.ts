import { getDirectusClient } from '../config/directus.js';
import { updateItem, readItems, createItem, deleteItem, readUsers, updateUser } from '@directus/sdk';

export class DirectusService {
    static async getUserById(id: string) {
        const users = await getDirectusClient().request(readUsers({
            filter: { id: { _eq: id } },
            fields: ['id', 'email', 'first_name', 'last_name', 'entra_id', 'status']
        }));
        return users[0] || null;
    }

    static async getUserByEntraId(entraId: string) {
        const users = await getDirectusClient().request(readUsers({
            filter: { entra_id: { _eq: entraId } },
            fields: ['id', 'email', 'first_name', 'last_name', 'entra_id', 'status']
        }));
        return users[0] || null;
    }

    static async getUserByEmail(email: string) {
        const users = await getDirectusClient().request(readUsers({
            filter: { email: { _eq: email.toLowerCase() } },
            fields: ['id', 'email', 'first_name', 'last_name', 'entra_id', 'status']
        }));
        return users[0] || null;
    }

    static async updateUser(id: string, data: any) {
        return await getDirectusClient().request(updateUser(id, data));
    }

    static async getCommitteeByAzureId(azureGroupId: string) {
        const committees = await getDirectusClient().request(readItems('committees', {
            filter: { azure_group_id: { _eq: azureGroupId } },
            fields: ['id', 'name', 'azure_group_id']
        }));
        return committees[0] || null;
    }

    static async getAllCommittees() {
        return await getDirectusClient().request(readItems('committees', {
            fields: ['id', 'name', 'azure_group_id']
        }));
    }

    static async getCommitteeByName(name: string) {
        const committees = await getDirectusClient().request(readItems('committees', {
            filter: { name: { _eq: name } },
            fields: ['id', 'name', 'azure_group_id']
        }));
        return committees[0] || null;
    }

    static async createCommittee(name: string) {
        return await getDirectusClient().request(createItem('committees', { name }));
    }

    static async getCommitteeMembers(userId: string) {
        return await getDirectusClient().request(readItems('committee_members', {
            filter: { user_id: { _eq: userId } },
            fields: ['id', 'committee_id', 'is_leader']
        }));
    }

    static async addMemberToCommittee(userId: string, committeeId: number, isLeader: boolean) {
        return await getDirectusClient().request(createItem('committee_members', {
            user_id: userId,
            committee_id: committeeId,
            is_leader: isLeader,
            is_visible: true
        }));
    }

    static async updateCommitteeMember(id: number, data: any) {
        return await getDirectusClient().request(updateItem('committee_members', id, data));
    }

    static async removeMemberFromCommittee(id: number) {
        return await getDirectusClient().request(deleteItem('committee_members', id));
    }
}
