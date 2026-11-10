import { mobileRoute } from '@/server/mobile/http';
import { mobileTickets } from '@/server/mobile/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = mobileRoute(mobileTickets);
