# Salve Mundi Email API

Simple Express.js server that sends emails via Microsoft Graph API. This server acts as a secure backend for the Salve Mundi website to send email notifications without exposing Microsoft credentials to the frontend.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Microsoft Azure account with Entra ID app registration
- Access to Microsoft 365 mailbox

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```
   
   Fill in your Microsoft Graph credentials in `.env`:
   - `MS_GRAPH_TENANT_ID` - Your Azure AD tenant ID
   - `MS_GRAPH_CLIENT_ID` - Your app registration client ID
   - `MS_GRAPH_CLIENT_SECRET` - Your app registration client secret
   - `MS_GRAPH_SENDER_UPN` - Email address to send from (e.g., noreply@salvemundi.nl)
   - `PORT` - Server port (default: 3001)

3. **Run the server**:

   ```bash
   node server.js
   ```
   
   You should see:
   ```
   🚀 Email API server running on port 3001
   📧 Ready to send emails via Microsoft Graph
   ```

## 📡 API Documentation

### Send Email

**Endpoint**: `POST /send-email`

**Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello!</h1><p>This is a test email.</p>",
  "from": "noreply@salvemundi.nl",
  "fromName": "Salve Mundi"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject line |
| `html` | string | Yes | Email body in HTML format |
| `from` | string | No | Sender email (defaults to `MS_GRAPH_SENDER_UPN`) |
| `fromName` | string | No | Sender display name (defaults to "Salve Mundi") |

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Email sent successfully",
  "sentTo": "recipient@example.com"
}
```

**Error Responses**:

| Status | Body | Description |
|--------|------|-------------|
| 400 | `{"error": "Missing required fields: to, subject, html"}` | Invalid request |
| 500 | `{"error": "Internal server error", "message": "..."}` | Server or API error |

### Health Check

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "ok"
}
```

## 🔗 Website Integration

### Development

In your website's `.env`:

```bash
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/send-email
VITE_EMAIL_FROM=noreply@salvemundi.nl
VITE_EMAIL_FROM_NAME=Salve Mundi
```

### Production

```bash
VITE_EMAIL_API_ENDPOINT=https://api.salvemundi.nl/send-email
VITE_EMAIL_FROM=noreply@salvemundi.nl
VITE_EMAIL_FROM_NAME=Salve Mundi
```

The website's email service (`src/lib/email-service.ts`) will automatically use these endpoints to send:
- Activity signup confirmations
- Intro week signup confirmations
- Membership signup notifications
- General notification emails

## 🚢 Deployment

### Option 1: Deploy to Same Server as Directus (Recommended)

1. **Copy the folder to your server**:

   ```bash
   scp -r email-api user@your-server:/var/www/
   ```

2. **Install production dependencies**:

   ```bash
   cd /var/www/email-api
   npm install --production
   ```

3. **Configure environment variables**:

   ```bash
   nano .env
   # Add your production credentials
   ```

4. **Use PM2 to keep it running**:

   ```bash
   npm install -g pm2
   pm2 start server.js --name salvemundi-email-api
   pm2 startup
   pm2 save
   ```

5. **Configure Nginx to proxy requests**:

   Add to your nginx config:
   
   ```nginx
   location /api/send-email {
       proxy_pass http://localhost:3001/send-email;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
   }
   ```
   
   Then reload nginx:
   
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Update website `.env` to use production URL**:

   ```bash
   VITE_EMAIL_API_ENDPOINT=https://admin.salvemundi.nl/api/send-email
   ```

### Option 2: Deploy to Vercel (Serverless)

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`**:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ],
     "env": {
       "MS_GRAPH_TENANT_ID": "@ms-graph-tenant-id",
       "MS_GRAPH_CLIENT_ID": "@ms-graph-client-id",
       "MS_GRAPH_CLIENT_SECRET": "@ms-graph-client-secret",
       "MS_GRAPH_SENDER_UPN": "@ms-graph-sender-upn"
     }
   }
   ```

3. **Add secrets to Vercel**:

   ```bash
   vercel secrets add ms-graph-tenant-id "your-tenant-id"
   vercel secrets add ms-graph-client-id "your-client-id"
   vercel secrets add ms-graph-client-secret "your-client-secret"
   vercel secrets add ms-graph-sender-upn "noreply@salvemundi.nl"
   ```

4. **Deploy**:

   ```bash
   vercel --prod
   ```

5. **Update website `.env`**:

   ```bash
   VITE_EMAIL_API_ENDPOINT=https://your-project.vercel.app/send-email
   ```

### Option 3: Deploy to Railway/Render

1. **Connect your GitHub repository** to Railway or Render
2. **Set environment variables** in the dashboard:
   - `MS_GRAPH_TENANT_ID`
   - `MS_GRAPH_CLIENT_ID`
   - `MS_GRAPH_CLIENT_SECRET`
   - `MS_GRAPH_SENDER_UPN`
   - `PORT` (Railway auto-sets this)
3. **Deploy** - It will auto-deploy on push
4. **Update website `.env`** with the provided URL

## 🧪 Testing

### Test with cURL

```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email from Salve Mundi",
    "html": "<h1>Hello!</h1><p>This is a test email from the email API.</p>"
  }'
```

### Test Health Check

```bash
curl http://localhost:3001/health
```

### Test from Website

1. Start the email API server
2. Start your website (`npm run dev`)
3. Sign up for an activity
4. Check your email inbox

## 🔒 Security Best Practices

- ✅ **Never commit `.env` file** - It's in `.gitignore`
- ✅ **Use environment variables** for all secrets
- ✅ **CORS configured** to only allow specific domains
- ⚠️ **Consider rate limiting** for production (e.g., express-rate-limit)
- ⚠️ **Consider API key authentication** for additional security
- ✅ **Credentials stay server-side** - Frontend never sees them

### Adding Rate Limiting (Recommended for Production)

Install:
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/send-email', limiter);
```

## 🐛 Troubleshooting

### Error: "Failed to get token"
- **Check**: Verify `MS_GRAPH_TENANT_ID`, `MS_GRAPH_CLIENT_ID`, and `MS_GRAPH_CLIENT_SECRET` are correct
- **Check**: Client secret hasn't expired in Azure portal
- **Fix**: Generate a new client secret in Azure → App registrations → Certificates & secrets

### Error: "Graph sendMail failed: 401"
- **Check**: App has `Mail.Send` Application permission (not Delegated)
- **Check**: Admin consent has been granted
- **Fix**: Go to Azure → App registrations → API permissions → Grant admin consent

### Error: "Graph sendMail failed: 403"
- **Check**: The sender email (`MS_GRAPH_SENDER_UPN`) exists in your Microsoft 365 tenant
- **Check**: App has permission to send from this mailbox
- **Fix**: Create a shared mailbox or use an existing user's email

### Error: "Graph sendMail failed: 500"
- **Check**: The sender email matches exactly with a user principal name in Azure AD
- **Check**: The mailbox is provisioned (shared mailboxes take 10-15 minutes)
- **Fix**: Wait for mailbox provisioning or use a different sender email

### Emails not arriving
- **Check**: Spam/junk folder
- **Check**: Server logs for errors
- **Check**: Azure AD audit logs (portal.azure.com → Azure Active Directory → Audit logs)
- **Fix**: Verify sender email is valid and not blacklisted

### CORS errors in browser
- **Check**: Your domain is in the CORS whitelist in `server.js`
- **Fix**: Add your domain to the `origin` array in the CORS configuration

## 📝 Logs

Server logs include:
- 📧 Email sending attempts
- ✅ Successful sends
- ❌ Errors with details
- 🔍 Token acquisition status

Watch logs in real-time:
```bash
# If using PM2
pm2 logs salvemundi-email-api

# If running directly
# Logs appear in terminal
```

## 📚 Additional Resources

- [Microsoft Graph sendMail API](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [Azure App Registration Setup](../readme/AUTH_SETUP.md)
- [Microsoft Graph Permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs
3. Check Azure AD audit logs
4. Verify Microsoft credentials in `.env`
