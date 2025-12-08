# Email API Microsoft Graph Authentication Error - Troubleshooting Guide

## Error
```
Token error: 
❌ Error: Error: Failed to get token: Not Found
```

## Root Cause
The email-api service is unable to authenticate with Microsoft Graph API to get an access token. This is typically caused by one of the following:

1. **Missing or incorrect environment variables** (MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET)
2. **Incorrect Azure AD App Registration configuration**
3. **The .env file not being loaded properly on the server**

## Immediate Diagnostic Steps

### 1. Check if environment variables are set
SSH into the server and check the running container:

```bash
docker exec email-api env | grep MS_GRAPH
```

Expected output should show:
```
MS_GRAPH_TENANT_ID=<your-tenant-id>
MS_GRAPH_CLIENT_ID=<your-client-id>
MS_GRAPH_CLIENT_SECRET=<your-secret>
MS_GRAPH_SENDER_UPN=noreply@salvemundi.nl
```

### 2. Check if .env file exists
```bash
cd /opt/email-api
cat .env
```

Should contain:
```
TAG=dev
MS_GRAPH_TENANT_ID=...
MS_GRAPH_CLIENT_ID=...
MS_GRAPH_CLIENT_SECRET=...
DIRECTUS_URL=...
DIRECTUS_API_TOKEN=...
```

### 3. Verify GitHub Secrets are set
In GitHub repository settings → Secrets and variables → Actions, verify these secrets exist:
- `DEV_MS_GRAPH_TENANT_ID`
- `DEV_MS_GRAPH_CLIENT_ID`
- `DEV_MS_GRAPH_CLIENT_SECRET`

### 4. Check the logs with the new diagnostic output
```bash
docker logs email-api -f
```

Look for the new diagnostic messages:
- ✅ Environment variables validated
- 🔑 Using tenant: <tenant-id>
- 🔐 Requesting token from: <url>

If you see "Missing required environment variables", those need to be fixed.

## Solutions

### Solution 1: Manually set environment variables (Quick Fix)
If the automated deployment didn't work, you can manually update the .env file:

```bash
cd /opt/email-api
nano .env
```

Add the missing variables, then restart:
```bash
docker compose up -d email-api --force-recreate
```

### Solution 2: Re-run the deployment
Push a small change to trigger the GitHub Actions workflow:

```bash
# Add a comment or space to trigger deployment
cd email-api
echo "" >> README.md
git add .
git commit -m "Trigger email-api deployment"
git push origin Development
```

### Solution 3: Verify Azure AD App Registration
Go to Azure Portal → Azure Active Directory → App registrations → Your App

Verify:
1. **Application (client) ID** matches `MS_GRAPH_CLIENT_ID`
2. **Directory (tenant) ID** matches `MS_GRAPH_TENANT_ID`
3. **Client secret** is valid and matches `MS_GRAPH_CLIENT_SECRET`
   - Secrets expire! Check the expiration date
   - If expired, create a new one and update the GitHub secret

4. **API Permissions** include:
   - Microsoft Graph → Application permissions → `Mail.Send`
   - **Admin consent must be granted** (look for green checkmarks)

5. **User for sending** (`noreply@salvemundi.nl`) exists in your Azure AD tenant

### Solution 4: Test credentials manually
You can test the credentials using curl:

```bash
TENANT_ID="your-tenant-id"
CLIENT_ID="your-client-id"
CLIENT_SECRET="your-client-secret"

curl -X POST \
  "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&scope=https://graph.microsoft.com/.default&grant_type=client_credentials"
```

Expected response:
```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "access_token": "eyJ0eXAiOiJKV1QiLC..."
}
```

If you get an error, the credentials are incorrect or the app registration has issues.

## Code Changes Made

Updated `/email-api/server.js` to add better diagnostics:
- Validates that all required environment variables are present
- Logs the tenant ID being used
- Logs the full token endpoint URL
- Provides detailed error information when token request fails

## Next Steps After Fix

1. Restart the email-api container:
   ```bash
   docker compose restart email-api
   ```

2. Test by signing up for an activity on the website

3. Monitor the logs:
   ```bash
   docker logs email-api -f
   ```

4. You should see:
   - ✅ Environment variables validated
   - ✅ Got access token
   - ✅ Email sent successfully!

## Prevention

To prevent this issue in the future:

1. **Set secret expiration reminders** in your calendar (Azure AD client secrets typically expire after 1-2 years)
2. **Monitor the deployment logs** after pushing changes
3. **Set up health checks** to alert if the email service is down
4. **Document the Azure AD app registration** details in a secure location

## Related Files
- `/email-api/server.js` - Main email service code
- `/email-api/docker-compose.yml` - Container configuration
- `/.github/workflows/deploy-email.yml` - Deployment workflow
