'use server';

import * as events from './kroegentocht/kroegentocht-event.actions';
import * as signups from './kroegentocht/kroegentocht-signup.actions';
import * as settings from './kroegentocht/kroegentocht-settings.actions';
import { type PubCrawlEvent, type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    return events.getPubCrawlEvents();
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    return events.getPubCrawlEvent(id);
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    return events.upsertPubCrawlEvent(data);
}

export async function uploadPubCrawlImage(formData: FormData) {
    return events.uploadPubCrawlImage(formData);
}

export async function getPubCrawlSignups(eventId: number) {
    return signups.getPubCrawlSignups(eventId);
}

export async function getPubCrawlSignup(id: number) {
    return signups.getPubCrawlSignup(id);
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    return signups.deletePubCrawlSignup(id, eventId);
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: Partial<PubCrawlSignup>) {
    return signups.updatePubCrawlSignup(id, eventId, data);
}

export async function toggleKroegentochtVisibility() {
    return settings.toggleKroegentochtVisibility();
}

export async function getKroegentochtSettings() {
    return settings.getKroegentochtSettings();
}

export async function togglePubCrawlTicketCheckIn(ticketId: number, currentStatus: boolean, eventId: number) {
    return signups.togglePubCrawlTicketCheckIn(ticketId, currentStatus, eventId);
}

export async function updatePubCrawlTickets(signupId: number, eventId: number, tickets: { id: number, name: string, initial: string }[]) {
    return signups.updatePubCrawlTickets(signupId, eventId, tickets);
}

export async function deletePubCrawlTicket(ticketId: number, signupId: number, eventId: number) {
    return signups.deletePubCrawlTicket(ticketId, signupId, eventId);
}
