# Fix: 403 Forbidden Error on Notification Reminder Button

## Problem

When clicking the "Herinnering" (reminder) button in the admin panel, a **403 Forbidden** error occurred:

```
Failed to load resource: the server responded with a status of 403
Failed to send reminder: Error: Failed to send reminder
```

## Root Cause

The admin panel was calling the **notification API directly from the browser** (client-side):

```typescript
const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || '/api/notifications';
const response = await fetch(`${NOTIFICATION_API_URL}/notify-event-reminder`, {
  method: 'POST',
  // ...
});
```

This caused two issues:

1. **CORS (Cross-Origin Resource Sharing)** - The notification API's CORS policy didn't allow requests from the admin panel's domain
2. **Security** - Exposing the notification API URL to the browser is a security risk

## Solution

Implemented the **API Route Proxy Pattern** - create Next.js API routes that act as a secure server-side proxy to the notification API.

### Changes Made

**1. Created proxy API routes:**

- `/frontend/src/app/api/notifications/send-reminder/route.ts` - For event reminders
- `/frontend/src/app/api/notifications/send-custom/route.ts` - For custom notifications

These routes:
- Run on the **server-side** (not in the browser)
- Use the internal Docker network URL: `http://notification-api-prod:3003`
- No CORS issues since they're same-origin from the admin panel's perspective

**2. Updated admin panel code:**

`/frontend/src/app/admin/activiteiten/page.tsx`

**Before:**
```typescript
const response = await fetch(`${NOTIFICATION_API_URL}/notify-event-reminder`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId })
});
```

**After:**
```typescript
const response = await fetch('/api/notifications/send-reminder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId })
});
```

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Admin Panel    │────▶│  Next.js API Route   │────▶│  Notification API   │
│  (Browser)      │     │  (Server-Side)       │     │  (Docker Container) │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
   Same-origin           Internal Docker Network
   No CORS issues        http://notification-api-prod:3003
```

## Benefits

1. ✅ **No CORS issues** - Same-origin requests from browser to Next.js API
2. ✅ **More secure** - Notification API URL not exposed to browser
3. ✅ **Better error handling** - Server-side can add authentication, logging, etc.
4. ✅ **Consistent pattern** - Follows Next.js best practices

## Environment Variables

The API routes use a **server-side** environment variable:

```env
# .env.local or Docker environment
NOTIFICATION_API_URL=http://notification-api-prod:3003
```

Note: This is **NOT** `NEXT_PUBLIC_*` - it's only available on the server, not in the browser.

## Testing

After deploying:

1. Go to Admin > Activiteiten
2. Click the "Herinnering" button on any event
3. Confirm the action
4. Should see: "Herinnering verstuurd naar X gebruiker(s)!"

## Related Files

- `/frontend/src/app/api/notifications/send-reminder/route.ts` (new)
- `/frontend/src/app/api/notifications/send-custom/route.ts` (new)
- `/frontend/src/app/admin/activiteiten/page.tsx` (updated)
- `/notification-api/server.js` (no changes needed)

## Future Improvements

Consider adding:
- Authentication/authorization check in the API routes
- Rate limiting
- Better error messages
- Logging to track who sends notifications
