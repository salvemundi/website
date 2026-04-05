import { getDirectusClient } from '../config/directus.js';
import { updateItem, readItems, createItem, deleteItem, readUsers, updateUser, createUser } from '@directus/sdk';
import { Event, EventSignup, FeatureFlag } from '../types/schema.js';

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

    static async createUser(data: any) {
        return await getDirectusClient().request(createUser(data));
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

    static async getAllCommitteeMembers() {
        return await getDirectusClient().request(readItems('committee_members', {
            fields: ['id', 'user_id', 'committee_id', 'is_leader'],
            limit: -1
        }));
    }

    static async getAllUsers() {
        return await getDirectusClient().request(readUsers({
            fields: ['id', 'email', 'first_name', 'last_name', 'entra_id', 'status', 'membership_expiry'],
            limit: -1
        }));
    }

    static async getUpcomingEvents(daysAhead: number): Promise<Event[]> {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysAhead);
        const dateStr = targetDate.toISOString().split('T')[0];

        return await getDirectusClient().request(readItems('events', {
            filter: { event_date: { _eq: dateStr } },
            fields: ['id', 'name', 'event_date', 'event_time', 'location']
        }));
    }

    static async getPaidEventSignups(eventId: number): Promise<EventSignup[]> {
        return await getDirectusClient().request(readItems('event_signups', {
            filter: { 
                event_id: { _eq: eventId },
                payment_status: { _eq: 'paid' }
            },
            fields: ['id', 'participant_name', 'participant_email']
        }));
    }

    static async isFlagActive(key: string): Promise<boolean> {
        try {
            const items = await getDirectusClient().request(readItems('feature_flags', {
                filter: { route_match: { _eq: key } },
                fields: ['is_active']
            }));
            return items?.[0]?.is_active ?? false;
        } catch (err) {
            console.error(`[DirectusService] Error checking flag ${key}:`, err);
            return false;
        }
    }
}
