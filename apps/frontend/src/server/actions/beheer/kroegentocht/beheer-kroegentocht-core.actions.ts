'use server';

import * as events from './beheer-kroegentocht-event.actions';
import * as signups from './beheer-kroegentocht-signup.actions';
import * as settings from './beheer-kroegentocht-settings.actions';
import { type PubCrawlEvent, type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    return events.getPubCrawlEvents();
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    return events.getPubCrawlEvent(id);
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>): Promise<{ success: boolean }> {
    return events.upsertPubCrawlEvent(data);
}

export async function uploadPubCrawlImage(formData: FormData): Promise<{ data: { id: string } }> {
    return events.uploadPubCrawlImage(formData);
}

export async function getPubCrawlSignups(eventId: number): Promise<Awaited<ReturnType<typeof signups.getPubCrawlSignups>>> {
    return signups.getPubCrawlSignups(eventId);
}

export async function getPubCrawlSignup(id: number): Promise<Awaited<ReturnType<typeof signups.getPubCrawlSignup>>> {
    return signups.getPubCrawlSignup(id);
}

export async function deletePubCrawlSignup(id: number, eventId: number): Promise<{ success: boolean }> {
    return signups.deletePubCrawlSignup(id, eventId);
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: Partial<PubCrawlSignup>): Promise<{ success: boolean }> {
    return signups.updatePubCrawlSignup(id, eventId, data);
}

export async function toggleKroegentochtVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    return settings.toggleKroegentochtVisibility();
}

export async function getKroegentochtSettings(): Promise<{ show: boolean }> {
    return settings.getKroegentochtSettings();
}

export async function togglePubCrawlTicketCheckIn(ticketId: number, currentStatus: boolean, eventId: number): Promise<{ success: boolean; newStatus: boolean }> {
    return signups.togglePubCrawlTicketCheckIn(ticketId, currentStatus, eventId);
}

export async function updatePubCrawlTickets(signupId: number, eventId: number, tickets: { id: number, name: string, initial: string }[]): Promise<{ success: boolean }> {
    return signups.updatePubCrawlTickets(signupId, eventId, tickets);
}

export async function deletePubCrawlTicket(ticketId: number, signupId: number, eventId: number): Promise<{ success: boolean }> {
    return signups.deletePubCrawlTicket(ticketId, signupId, eventId);
}

export async function distributePubCrawlSignups(eventId: number): Promise<{ success: boolean }> {
    return signups.distributePubCrawlSignups(eventId);
}

export async function savePubCrawlGroupsAssignment(eventId: number, assignments: { signupId: number, groupName: string | null }[]): Promise<{ success: boolean }> {
    return signups.savePubCrawlGroupsAssignment(eventId, assignments);
}

export async function updatePubCrawlEventGroups(eventId: number, groups: unknown[]): Promise<{ success: boolean }> {
    return events.updatePubCrawlEventGroups(eventId, groups);
}

export async function createManualPubCrawlSignup(
    eventId: number,
    data: {
        name: string;
        email: string;
        association?: string;
        initial?: string;
        group_name?: string | null;
    }
): Promise<{ success: boolean; signupId: number }> {
    return signups.createManualPubCrawlSignup(eventId, data);
}
