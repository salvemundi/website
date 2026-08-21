'use server';

import * as signups from './admin-intro-signup.actions';
import * as planning from './admin-intro-planning.actions';
import * as confidants from './admin-intro-confidants.actions';
import * as settings from './admin-intro-settings.actions';
import * as groups from './admin-intro-groups.actions';
import type { IntroSignup, IntroParentSignup } from '@salvemundi/validations/directus/schema';
import { type IntroPlanningItem, type IntroConfidant, type IntroGroup } from '@salvemundi/validations/schema/intro.zod';

export async function getIntroSignups(): Promise<IntroSignup[]> {
    return signups.getIntroSignups();
}

export async function deleteIntroSignup(id: number) {
    return signups.deleteIntroSignup(id);
}

export async function getIntroParentSignups(): Promise<IntroParentSignup[]> {
    return signups.getIntroParentSignups();
}

export async function deleteIntroParentSignup(id: number) {
    return signups.deleteIntroParentSignup(id);
}

export async function getIntroPlanning(): Promise<IntroPlanningItem[]> {
    return planning.getIntroPlanning();
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>) {
    return planning.upsertIntroPlanning(item);
}

export async function deleteIntroPlanning(id: number) {
    return planning.deleteIntroPlanning(id);
}

export async function getIntroConfidants(): Promise<IntroConfidant[]> {
    return confidants.getIntroConfidants();
}

export async function upsertIntroConfidant(item: Partial<IntroConfidant>) {
    return confidants.upsertIntroConfidant(item);
}

export async function deleteIntroConfidant(id: number) {
    return confidants.deleteIntroConfidant(id);
}

export async function uploadIntroConfidantImage(formData: FormData) {
    return confidants.uploadIntroConfidantImage(formData);
}

export async function updateIntroSignup(id: number, data: Partial<{ [key: string]: unknown }>) {
    return signups.updateIntroSignup(id, data);
}

export async function updateIntroParentSignup(id: number, data: Partial<{ [key: string]: unknown }>) {
    return signups.updateIntroParentSignup(id, data);
}

export async function toggleIntroVisibility() {
    return settings.toggleIntroVisibility();
}

export async function getIntroPlanningImage() {
    return settings.getIntroPlanningImage();
}

export async function uploadIntroPlanningImage(formData: FormData) {
    return settings.uploadIntroPlanningImage(formData);
}

export async function removeIntroPlanningImage() {
    return settings.removeIntroPlanningImage();
}

export async function getIntroInfoBooklet() {
    return settings.getIntroInfoBooklet();
}

export async function uploadIntroInfoBooklet(formData: FormData) {
    return settings.uploadIntroInfoBooklet(formData);
}

export async function removeIntroInfoBooklet() {
    return settings.removeIntroInfoBooklet();
}

export async function getIntroQrScanCount() {
    return settings.getIntroQrScanCount();
}

export async function toggleIntroAttendanceVisibility() {
    return settings.toggleIntroAttendanceVisibility();
}

export async function getIntroSignupSettings() {
    return settings.getIntroSignupSettings();
}

export async function toggleIntroStudentSignups() {
    return settings.toggleIntroStudentSignups();
}

export async function toggleIntroParentSignups() {
    return settings.toggleIntroParentSignups();
}


export async function getIntroGroupsForAdmin() {
    return groups.getIntroGroupsForAdmin();
}

export async function getApprovedOudersForPicker() {
    return groups.getApprovedOudersForPicker();
}

export async function createGroup(data: Partial<IntroGroup>) {
    return groups.createGroup(data);
}

export async function updateGroup(id: number, data: Partial<IntroGroup>) {
    return groups.updateGroup(id, data);
}

export async function deleteGroup(id: number) {
    return groups.deleteGroup(id);
}

export async function addGroupLeader(groupId: number, userId: string) {
    return groups.addGroupLeader(groupId, userId);
}

export async function removeGroupLeader(groupId: number, userId: string) {
    return groups.removeGroupLeader(groupId, userId);
}
