'use server';

import * as signups from './intro/intro-signup.actions';
import * as blogs from './intro/intro-blog.actions';
import * as planning from './intro/intro-planning.actions';
import * as settings from './intro/intro-settings.actions';
import type { DbIntroSignup, DbIntroParentSignup } from '@salvemundi/validations/directus/schema';
import { type IntroBlog, type IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';

export async function getIntroSignups(): Promise<DbIntroSignup[]> {
    return signups.getIntroSignups();
}

export async function deleteIntroSignup(id: number) {
    return signups.deleteIntroSignup(id);
}

export async function getIntroParentSignups(): Promise<DbIntroParentSignup[]> {
    return signups.getIntroParentSignups();
}

export async function deleteIntroParentSignup(id: number) {
    return signups.deleteIntroParentSignup(id);
}

export async function getIntroBlogs(): Promise<IntroBlog[]> {
    return blogs.getIntroBlogs();
}

export async function upsertIntroBlog(blog: Partial<IntroBlog>) {
    return blogs.upsertIntroBlog(blog);
}

export async function deleteIntroBlog(id: number) {
    return blogs.deleteIntroBlog(id);
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

export async function updateIntroSignup(id: number, data: Partial<Record<string, unknown>>) {
    return signups.updateIntroSignup(id, data);
}

export async function updateIntroParentSignup(id: number, data: Partial<Record<string, unknown>>) {
    return signups.updateIntroParentSignup(id, data);
}

export async function toggleIntroVisibility() {
    return settings.toggleIntroVisibility();
}
