# ✅ Fixed: CORS in Preview Mode (npm run preview)

## The Problem
After running `npm run build && npm run preview`, the application was trying to access `https://admin.salvemundi.nl` directly, causing CORS errors because:
- `import.meta.env.DEV` is `false` in preview mode
- The code was switching to direct URLs instead of using the proxy
- Preview mode runs on localhost but doesn't have dev-only checks

## The Solution
Updated the logic to detect **localhost** instead of checking dev mode, so both `npm run dev` and `npm run preview` use the proxy.

## Changes Made

### 1. **src/lib/directus.ts**
```typescript
// BEFORE (broken in preview):
const isDevelopment = import.meta.env.DEV;
export const directusUrl = isDevelopment ? '/api' : 'https://admin.salvemundi.nl';

// AFTER (works in both dev and preview):
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const directusUrl = isLocalhost ? '/api' : (import.meta.env.VITE_DIRECTUS_URL || '/api');
```

### 2. **src/lib/api.ts**
```typescript
// BEFORE (broken in preview):
const isDevelopment = import.meta.env.DEV;

// AFTER (works in both dev and preview):
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
```

### 3. **vite.config.js**
Added proxy configuration to the `preview` section (previously only in `server`):
```javascript
preview: {
  host: '0.0.0.0',
  port: 5173,
  proxy: {
    '/api/assets': { /* ... */ },
    '/api': { /* ... */ }
  }
}
```

## How It Works Now

### Development (`npm run dev`):
```
localhost:5173 → /api/* → proxy → admin.salvemundi.nl
✅ No CORS
```

### Preview (`npm run preview`):
```
localhost:5173 → /api/* → proxy → admin.salvemundi.nl
✅ No CORS
```

### Production (deployed to real domain):
```
yourdomain.com → https://admin.salvemundi.nl (direct)
✅ Works if CORS is configured on server
   OR
yourdomain.com → /api/* → your server proxy → admin.salvemundi.nl
```

## Testing Steps

1. **Build and run preview**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Open browser** to `http://localhost:5173`

3. **Navigate to** `/activiteiten`

4. **Check that**:
   - ✅ No CORS errors in console
   - ✅ Events load correctly
   - ✅ Images display
   - ✅ Network tab shows `/api/items/events` requests with 200 OK

## Key Points

✅ **Both dev and preview use the proxy on localhost**
✅ **Production can use direct URLs or proxy based on environment**
✅ **Consistent behavior between dev and preview**
✅ **No more CORS errors in preview mode**

## Status: ✅ RESOLVED

Preview mode now works exactly like dev mode with no CORS issues!

