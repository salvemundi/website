# Quick Fix Summary - Email API Authentication Issue

## Current Status
✅ **Fixed**: Frontend can now reach the email-api (502 error resolved)  
❌ **New Issue**: Email-api cannot authenticate with Microsoft Graph (404 Not Found)

## The Problem
The email-api container is receiving requests but failing to get an access token from Microsoft Entra ID because:
- Environment variables (MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET) are missing or incorrect
- The .env file on the server may not have been created properly during deployment

## Immediate Action Required

### Step 1: Check environment variables on the server
```bash
# SSH into your server
ssh user@dev.salvemundi.nl

# Check if variables are set in the container
docker exec email-api env | grep MS_GRAPH

# Check if .env file exists
cd /opt/email-api
cat .env
```

### Step 2: If variables are missing, manually create/update .env file
```bash
cd /opt/email-api
nano .env
```

Add these lines (get values from GitHub Secrets or Azure Portal):
```
TAG=dev
MS_GRAPH_TENANT_ID=your-tenant-id-here
MS_GRAPH_CLIENT_ID=your-client-id-here
MS_GRAPH_CLIENT_SECRET=your-client-secret-here
DIRECTUS_URL=your-directus-url
DIRECTUS_API_TOKEN=your-directus-token
```

### Step 3: Restart the container
```bash
docker compose up -d email-api --force-recreate
```

### Step 4: Test and monitor
```bash
# Watch the logs
docker logs email-api -f

# You should now see:
# ✅ Environment variables validated
# 🔑 Using tenant: <your-tenant-id>
# ✅ Got access token
```

## Code Changes Made

### 1. Fixed 502 Bad Gateway (COMPLETED)
- Updated frontend API route to use internal Docker networking
- Changed from external URL to `http://email-api:3001/send-email`

### 2. Added Diagnostics to email-api (COMPLETED)
- Added validation to check if environment variables are set
- Added detailed logging to show which tenant ID is being used
- Added better error messages when authentication fails

## Files Modified
- `/frontend/src/app/api/send-email/route.ts` - Fixed endpoint configuration
- `/frontend/Dockerfile` - Added EMAIL_API_ENDPOINT environment variable
- `/frontend/docker-compose.yml` - Added environment variable config
- `/email-api/server.js` - Added environment validation and better logging

## Verify Azure AD Configuration
If environment variables are correct but still failing, check Azure Portal:
1. Go to Azure Active Directory → App registrations
2. Find your app and verify:
   - Client ID matches MS_GRAPH_CLIENT_ID
   - Tenant ID matches MS_GRAPH_TENANT_ID
   - Client secret is not expired (create new one if expired)
   - API permissions include Mail.Send with admin consent granted

## Next Deployment
These changes need to be built and deployed:
```bash
git add .
git commit -m "Fix email API authentication and add diagnostics"
git push origin Development
```

The GitHub Actions workflow will automatically rebuild and deploy both services.
