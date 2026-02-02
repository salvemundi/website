# ✅ Notification API Configuration - Simplified

## Updated Configuration

All environments (dev, preprod, production) now use the **same centralized notification API**:

```
https://notifications.salvemundi.nl
```

## What Changed

### Before
- Dev tried to use: `http://notification-api-dev:3003` (internal Docker)
- Preprod tried to use: `http://notification-api-preprod:3003` (internal Docker)
- Production tried to use: `http://notification-api-prod:3003` (internal Docker)
- **Result:** CORS errors and connection issues

### After
- **All environments** use: `https://notifications.salvemundi.nl`
- **Result:** Consistent, reliable notifications across all environments

## Configuration Files Updated

1. **`/frontend/src/app/api/notifications/send-reminder/route.ts`**
   - Simplified to always use public URL
   - Removed complex environment detection logic

2. **`/frontend/src/app/api/notifications/send-custom/route.ts`**
   - Simplified to always use public URL
   - Removed complex environment detection logic

3. **`/frontend/docker-compose.yml`**
   - Simplified environment variables
   - Only needs `NEXT_PUBLIC_NOTIFICATION_API_URL`

## Environment Variable

Only one variable needed in docker-compose.yml:

```yaml
environment:
  - NEXT_PUBLIC_NOTIFICATION_API_URL=https://notifications.salvemundi.nl
```

This works for:
- ✅ `dev.salvemundi.nl`
- ✅ `preprod.salvemundi.nl`
- ✅ `salvemundi.nl` / `www.salvemundi.nl`

## Testing

After deploying the updated frontend:

```bash
# From dev environment
curl -X POST https://dev.salvemundi.nl/api/notifications/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"eventId": 123}'

# From preprod environment
curl -X POST https://preprod.salvemundi.nl/api/notifications/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"eventId": 123}'

# From production environment
curl -X POST https://salvemundi.nl/api/notifications/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"eventId": 123}'
```

All should successfully call `https://notifications.salvemundi.nl` and work identically.

## Benefits

✅ **Simpler** - One notification service for all environments  
✅ **More reliable** - No internal Docker networking issues  
✅ **Consistent** - Same behavior across dev, preprod, and production  
✅ **Easier debugging** - All environments work the same way  
✅ **No CORS issues** - Proxy pattern handles cross-origin requests  

## Architecture

```
┌──────────────────────┐
│ dev.salvemundi.nl    │─┐
│ (Frontend Container) │ │
└──────────────────────┘ │
                         │
┌──────────────────────┐ │    ┌─────────────────┐    ┌──────────────────────┐
│preprod.salvemundi.nl │─┼───▶│ /api/notifications│───▶│ notifications.       │
│ (Frontend Container) │ │    │ (Next.js proxy)  │    │ salvemundi.nl        │
└──────────────────────┘ │    └─────────────────┘    │ (Notification API)   │
                         │                             └──────────────────────┘
┌──────────────────────┐ │
│   salvemundi.nl      │─┘
│ (Frontend Container) │
└──────────────────────┘
```

## No Changes Needed

- ✅ Notification API (`notification-api/`) - No changes needed
- ✅ Push notification service (`push-notification-service.ts`) - Already uses correct URL
- ✅ Service worker - Already uses correct URL

Only the admin panel proxy routes were updated to use the public URL consistently.
