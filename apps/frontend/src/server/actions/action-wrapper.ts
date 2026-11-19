import 'server-only';

import { headers } from 'next/headers';
import { z } from 'zod';
import type { BeheerFeature } from '@/shared/lib/permissions-config';
import type { StronglyTypedAdminUser } from '@/server/actions/beheer/beheer-utils.actions';
import { sessionService, type ActiveSession } from '@/server/security/SessionService';
import { checkRateLimit } from '@/server/utils/ratelimit';
import { safeConsoleError } from '@/server/utils/logger';

export interface ActionRateLimitOptions {
    key: string;
    limit: number;
    windowSeconds: number;
    errorMessage?: string;
}

export interface ActionFieldErrors {
    [key: string]: string[] | undefined;
}

export interface ActionFailureResult {
    success: false;
    error: string;
    message?: string;
    errors?: undefined;
    fieldErrors?: ActionFieldErrors;
}

export interface PublicActionContext {
    getClientIp: () => Promise<string>;
    getBaseUrl: () => Promise<string>;
}

export interface MemberActionContext {
    session: ActiveSession;
    userId: string;
    getBaseUrl: () => Promise<string>;
}

export interface AdminActionContext {
    user: StronglyTypedAdminUser;
    userId: string;
    isLeader: boolean;
    canToggleVisibility: boolean;
}

export interface BaseActionOptions<TRaw, TParsed> {
    actionName: string;
    schema?: z.ZodType<TParsed>;
    mapInput?: (raw: TRaw) => unknown;
    rateLimit?: ActionRateLimitOptions;
    validationErrorMessage?: string;
    fallbackErrorMessage?: string;
}

export interface PublicActionOptions<TRaw, TParsed, TResult> extends BaseActionOptions<TRaw, TParsed> {
    honeypot?: (raw: TRaw) => unknown;
    honeypotErrorMessage?: string;
    handler: (input: TParsed, ctx: PublicActionContext) => Promise<TResult>;
}

export interface MemberActionOptions<TRaw, TParsed, TResult> extends BaseActionOptions<TRaw, TParsed> {
    honeypot?: (raw: TRaw) => unknown;
    honeypotErrorMessage?: string;
    unauthenticatedErrorMessage?: string;
    nonMemberErrorMessage?: string;
    handler: (input: TParsed, ctx: MemberActionContext) => Promise<TResult>;
}

export interface AdminActionOptions<TRaw, TParsed, TResult> extends BaseActionOptions<TRaw, TParsed> {
    feature: BeheerFeature;
    handler: (input: TParsed, ctx: AdminActionContext) => Promise<TResult>;
}

export interface AdminQueryOptions<TRaw, TParsed, TResult> {
    actionName: string;
    feature: BeheerFeature;
    schema?: z.ZodType<TParsed>;
    mapInput?: (raw: TRaw) => unknown;
    fallbackValue: TResult;
    handler: (input: TParsed, ctx: AdminActionContext) => Promise<TResult>;
}

export interface PublicQueryOptions<TRaw, TParsed, TResult> {
    actionName: string;
    schema?: z.ZodType<TParsed>;
    mapInput?: (raw: TRaw) => unknown;
    fallbackValue: TResult;
    handler: (input: TParsed) => Promise<TResult>;
}

export async function resolveActionClientIp(): Promise<string> {
    const headerList = await headers();
    const trustedIp = headerList.get('x-trusted-ip');
    if (trustedIp && trustedIp !== 'unknown') return trustedIp;

    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',').at(0)?.trim() || 'unknown';
    }

    return headerList.get('x-real-ip') || 'unknown';
}

export async function resolveActionBaseUrl(): Promise<string> {
    const publicUrl = process.env.PUBLIC_URL?.replace(/\/$/, '');
    if (publicUrl) return publicUrl;

    const headerList = await headers();
    const forwardedHost = headerList.get('x-forwarded-host');
    if (forwardedHost) {
        const proto = headerList.get('x-forwarded-proto') || 'https';
        return `${proto}://${forwardedHost.split(',').at(0)?.trim() || ''}`;
    }

    const host = headerList.get('host');
    if (host) {
        const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
        const proto = headerList.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
        return `${proto}://${host}`;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    return appUrl || '';
}

export function isActionFailure(value: unknown): value is ActionFailureResult {
    return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        (value as { success?: unknown }).success === false
    );
}

function validateInput<TRaw, TParsed>(
    rawInput: TRaw,
    schema: z.ZodType<TParsed> | undefined,
    mapInput: ((raw: TRaw) => unknown) | undefined,
    validationErrorMessage: string
):
    | { ok: true; data: TParsed }
    | { ok: false; failure: ActionFailureResult } {
    const candidate = mapInput ? mapInput(rawInput) : rawInput;
    if (!schema) {
        return { ok: true, data: candidate as TParsed };
    }

    const parsed = schema.safeParse(candidate);
    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        return {
            ok: false,
            failure: {
                success: false,
                error: validationErrorMessage,
                fieldErrors: flattened.fieldErrors as ActionFieldErrors,
            },
        };
    }

    return { ok: true, data: parsed.data };
}

export function withAction<TRaw, TParsed, TResult>(
    options: PublicActionOptions<TRaw, TParsed, TResult>
): (rawInput: TRaw) => Promise<TResult | ActionFailureResult> {
    const fallbackError = options.fallbackErrorMessage ?? 'Er is een onverwachte fout opgetreden.';
    const validationError = options.validationErrorMessage ?? 'Vul alle verplichte velden correct in.';
    const honeypotError = options.honeypotErrorMessage ?? 'Ongeldige aanvraag.';

    return async (rawInput: TRaw): Promise<TResult | ActionFailureResult> => {
        try {
            if (options.honeypot && Boolean(options.honeypot(rawInput))) {
                return { success: false, error: honeypotError };
            }

            if (options.rateLimit) {
                const rateResult = await checkRateLimit(
                    options.rateLimit.key,
                    options.rateLimit.limit,
                    options.rateLimit.windowSeconds,
                    options.rateLimit.errorMessage
                );
                if (!rateResult.success) {
                    return rateResult;
                }
            }

            const validated = validateInput(rawInput, options.schema, options.mapInput, validationError);
            if (!validated.ok) {
                return validated.failure;
            }

            return await options.handler(validated.data, {
                getClientIp: resolveActionClientIp,
                getBaseUrl: resolveActionBaseUrl,
            });
        } catch (error: unknown) {
            safeConsoleError(`[${options.actionName}]`, error);
            return { success: false, error: fallbackError };
        }
    };
}

export function withMemberAction<TRaw, TParsed, TResult>(
    options: MemberActionOptions<TRaw, TParsed, TResult>
): (rawInput: TRaw) => Promise<TResult | ActionFailureResult> {
    const fallbackError = options.fallbackErrorMessage ?? 'Er is een onverwachte fout opgetreden.';
    const validationError = options.validationErrorMessage ?? 'Vul alle verplichte velden correct in.';
    const honeypotError = options.honeypotErrorMessage ?? 'Ongeldige aanvraag.';
    const unauthenticatedError = options.unauthenticatedErrorMessage ?? 'Je moet ingelogd zijn.';
    const nonMemberError = options.nonMemberErrorMessage ?? 'Alleen toegankelijk voor actieve leden.';

    return async (rawInput: TRaw): Promise<TResult | ActionFailureResult> => {
        try {
            if (options.honeypot && Boolean(options.honeypot(rawInput))) {
                return { success: false, error: honeypotError };
            }

            if (options.rateLimit) {
                const rateResult = await checkRateLimit(
                    options.rateLimit.key,
                    options.rateLimit.limit,
                    options.rateLimit.windowSeconds,
                    options.rateLimit.errorMessage
                );
                if (!rateResult.success) {
                    return rateResult;
                }
            }

            const membership = await sessionService.verifyMemberSession();
            if (!membership.ok) {
                return {
                    success: false,
                    error: membership.reason === 'unauthenticated' ? unauthenticatedError : nonMemberError,
                };
            }

            const validated = validateInput(rawInput, options.schema, options.mapInput, validationError);
            if (!validated.ok) {
                return validated.failure;
            }

            return await options.handler(validated.data, {
                session: membership.session,
                userId: membership.session.user.id,
                getBaseUrl: resolveActionBaseUrl,
            });
        } catch (error: unknown) {
            safeConsoleError(`[${options.actionName}]`, error);
            return { success: false, error: fallbackError };
        }
    };
}

export function withAdminAction<TRaw, TParsed, TResult>(
    options: AdminActionOptions<TRaw, TParsed, TResult>
): (rawInput: TRaw) => Promise<TResult | ActionFailureResult> {
    const fallbackError = options.fallbackErrorMessage ?? 'Er is een onverwachte fout opgetreden.';
    const validationError = options.validationErrorMessage ?? 'Ongeldige invoer.';

    return async (rawInput: TRaw): Promise<TResult | ActionFailureResult> => {
        try {
            const adminAccess = await sessionService.verifyAdminFeature(options.feature);
            if (!adminAccess.ok) {
                return { success: false, error: adminAccess.error };
            }

            if (options.rateLimit) {
                const rateResult = await checkRateLimit(
                    options.rateLimit.key,
                    options.rateLimit.limit,
                    options.rateLimit.windowSeconds,
                    options.rateLimit.errorMessage
                );
                if (!rateResult.success) {
                    return rateResult;
                }
            }

            const validated = validateInput(rawInput, options.schema, options.mapInput, validationError);
            if (!validated.ok) {
                return validated.failure;
            }

            return await options.handler(validated.data, {
                user: adminAccess.user,
                userId: adminAccess.user.id,
                isLeader: adminAccess.isLeader,
                canToggleVisibility: adminAccess.canToggleVisibility,
            });
        } catch (error: unknown) {
            safeConsoleError(`[${options.actionName}]`, error);
            return { success: false, error: fallbackError };
        }
    };
}

export function withQueryAction<TRaw, TParsed, TResult>(
    options: PublicQueryOptions<TRaw, TParsed, TResult>
): (rawInput: TRaw) => Promise<TResult> {
    return async (rawInput: TRaw): Promise<TResult> => {
        try {
            const candidate = options.mapInput ? options.mapInput(rawInput) : rawInput;
            let parsedInput: TParsed;
            if (options.schema) {
                const parsed = options.schema.safeParse(candidate);
                if (!parsed.success) {
                    return options.fallbackValue;
                }
                parsedInput = parsed.data;
            } else {
                parsedInput = candidate as TParsed;
            }

            return await options.handler(parsedInput);
        } catch (error: unknown) {
            safeConsoleError(`[${options.actionName}]`, error);
            return options.fallbackValue;
        }
    };
}

export function withAdminQueryAction<TRaw, TParsed, TResult>(
    options: AdminQueryOptions<TRaw, TParsed, TResult>
): (rawInput: TRaw) => Promise<TResult> {
    return async (rawInput: TRaw): Promise<TResult> => {
        const access = await sessionService.requireAdminFeature(options.feature);

        try {
            const candidate = options.mapInput ? options.mapInput(rawInput) : rawInput;
            let parsedInput: TParsed;
            if (options.schema) {
                const parsed = options.schema.safeParse(candidate);
                if (!parsed.success) {
                    return options.fallbackValue;
                }
                parsedInput = parsed.data;
            } else {
                parsedInput = candidate as TParsed;
            }

            return await options.handler(parsedInput, {
                user: access.user,
                userId: access.user.id,
                isLeader: access.isLeader,
                canToggleVisibility: access.canToggleVisibility,
            });
        } catch (error: unknown) {
            safeConsoleError(`[${options.actionName}]`, error);
            return options.fallbackValue;
        }
    };
}
