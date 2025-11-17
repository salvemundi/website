# Directus Entra ID Authentication Extension

This extension adds Microsoft Entra ID (Azure AD) authentication support to Directus.

## File Structure

```
directus-extension-entra-auth/
├── package.json          # Extension configuration
├── src/
│   └── index.js         # Main extension code (THIS FILE IS REQUIRED)
└── dist/
    └── index.js         # Built file (created by npm run build)
```

## Installation on Directus Server

### Step 1: Upload Files

Copy this entire folder to your Directus server at:
```
[your-directus-root]/extensions/endpoints/directus-extension-entra-auth/
```

### Step 2: Install Dependencies

SSH into your server and run:
```bash
cd /path/to/directus/extensions/endpoints/directus-extension-entra-auth
npm install
```

### Step 3: Build the Extension

```bash
npm run build
```

This creates the `dist/index.js` file that Directus will load.

### Step 4: Add Database Columns

Run this SQL on your Directus database:
```sql
ALTER TABLE directus_users 
ADD COLUMN IF NOT EXISTS entra_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS fontys_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_directus_users_entra_id ON directus_users(entra_id);
```

### Step 5: Configure Environment Variables

Add to your Directus `.env` file:
```env
DEFAULT_USER_ROLE_ID=your-default-role-uuid

# CORS settings (allow localhost during development)
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5175,http://localhost:5173,http://localhost:5174
```

### Step 6: Restart Directus

```bash
# If using PM2
pm2 restart directus

# If using systemd
systemctl restart directus

# If using Docker
docker restart directus
```

## Testing

After installation, test the endpoint:

```bash
curl -X POST https://your-directus-url.com/auth/login/entra \
  -H "Content-Type: application/json" \
  -d '{"token":"test","email":"test@test.com"}'
```

**Expected Results:**
- ❌ `404 Not Found` = Extension not loaded (rebuild and restart)
- ✅ `400 Bad Request` or `500 Internal Server Error` = Extension is working (error is expected with test data)

## Troubleshooting

### Extension not loading:
1. Check `dist/index.js` exists (created by `npm run build`)
2. Check Directus logs for extension loading errors
3. Verify file permissions (Directus user must be able to read files)

### Getting 404 errors:
- Make sure you ran `npm run build`
- Make sure you restarted Directus after building
- Check the extension shows as "Loaded" in Directus admin → Settings → Extensions

### Getting 500 errors:
- Check Directus server logs for detailed error messages
- Make sure database columns exist (`entra_id`, `fontys_email`)
- Verify dependencies are installed (`jsonwebtoken`, `jwks-rsa`)

## What This Extension Does

1. ✅ Verifies Microsoft ID tokens using JWKS
2. ✅ Creates new users from Microsoft accounts
3. ✅ Links existing users by email or entra_id
4. ✅ Syncs user data (name, email) on every login
5. ✅ Generates Directus access and refresh tokens
6. ✅ Detects Fontys members by email domain

## API Endpoint

**POST** `/auth/login/entra`

Request:
```json
{
  "token": "microsoft_id_token_here",
  "email": "user@student.fontys.nl"
}
```

Response:
```json
{
  "access_token": "directus_access_token",
  "refresh_token": "directus_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@student.fontys.nl",
    "first_name": "John",
    "last_name": "Doe",
    "entra_id": "microsoft_user_id",
    "fontys_email": "user@student.fontys.nl",
    "is_member": true
  }
}
```
