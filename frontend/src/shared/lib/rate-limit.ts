
// Simple in-memory rate limiter for Next.js API routes (Node.js runtime)
// Note: In serverless environments, this is instance-local.

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export interface RateLimitOptions {
    windowMs: number;
    max: number;
}

export function isRateLimited(identifier: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || (now - record.lastReset) > options.windowMs) {
        rateLimitMap.set(identifier, { count: 1, lastReset: now });
        return false;
    }

    record.count++;
    if (record.count > options.max) {
        return true;
    }

    return false;
}

// Helper to get IP address from request
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return 'unknown';
}
