# Salve Mundi Email API

Simple Express.js server that sends emails via Microsoft Graph API. This service acts as a secure backend for the Salve Mundi website to send email notifications without exposing Microsoft credentials to the frontend.

This README focuses on running the service locally, in Docker, and via `docker-compose` for easy development and deployment.

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js (v16+ / recommended v18)
- npm
- (Optional) Docker & docker-compose for containerized runs

### Install & Run Locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment example and fill values:

```bash
cp .env.example .env
# edit .env and add Azure/MS Graph credentials
```

3. Start the server (development):

```bash
npm run dev
```

Or start production-like server:

```bash
npm start
```

Server defaults to port `3001` (set via `PORT` in `.env`).

## 📦 Docker (recommended for easy deployment)

This repo includes a `Dockerfile` to run the email API in a container.

### Build image locally

From the `email-api` folder:

```bash
docker build -t salvemundi/email-api:local .
```

### Run container (simple)

Create a `.env` file with the required env vars (see list below), then:

```bash
docker run -d \
   --name salvemundi-email-api \
   --env-file .env \
   -p 3001:3001 \
   salvemundi/email-api:local
```

Visit `http://localhost:3001/health` to verify the service is up.

### Docker Compose (recommended for development)

Create a `docker-compose.yml` next to this folder (example below) or use the one in your deployment repository:

```yaml
version: '3.8'
services:
   email-api:
      image: salvemundi/email-api:local
      build: .
      env_file:
         - .env
      ports:
         - '3001:3001'
      restart: unless-stopped

# Example: if you have Directus or other services in compose, add them here and link as needed
```

Start with:

```bash
docker compose up --build -d
```

### Using Docker secrets (optional - recommended for production)

For production, avoid storing secrets in `.env` files in plain text. Use Docker secrets or your orchestration provider's secret manager (Docker Swarm, Kubernetes, AWS ECS Secrets, etc.).

Example (docker swarm):

```bash
echo "my-client-secret" | docker secret create ms_graph_client_secret -
```

Then mount/use the secret in your service definition.

## 🔐 Required Environment Variables

Create a `.env` with the following values (or set them via your orchestration provider):

- `MS_GRAPH_TENANT_ID` - Azure AD tenant ID
- `MS_GRAPH_CLIENT_ID` - App registration client ID
- `MS_GRAPH_CLIENT_SECRET` - App registration client secret
- `MS_GRAPH_SENDER_UPN` - The mailbox/user to send emails from (e.g., `noreply@salvemundi.nl`)
- `PORT` (optional) - default `3001`

Tip: production website expects the email endpoint as `https://your-host/send-email`. If you run the container behind nginx, proxy `/send-email` to the container.

## 📡 API Endpoints

### Send Email

Endpoint: `POST /send-email`

Headers: `Content-Type: application/json`

Request body example:

```json
{
   "to": "recipient@example.com",
   "subject": "Test Email",
   "html": "<h1>Hello!</h1><p>This is a test email.</p>",
   "from": "noreply@salvemundi.nl",
   "fromName": "Salve Mundi"
}
```

### Health Check

`GET /health` → `{ "status": "ok" }`

## 🧪 Testing

Quick cURL test (when running on localhost):

```bash
curl -X POST http://localhost:3001/send-email \
   -H "Content-Type: application/json" \
   -d '{
      "to": "your-email@example.com",
      "subject": "Test Email from Salve Mundi",
      "html": "<h1>Hello!</h1><p>This is a test email from the email API.</p>"
   }'
```

Health check:

```bash
curl http://localhost:3001/health
```

## 🛡️ Security & Production Notes

- Do not commit `.env` to source control. Use your platform's secret manager.
- Use HTTPS in front of the container (nginx, load balancer).
- Consider rate limiting (`express-rate-limit`) and authentication (API keys) for production.
- Run the container as a non-root user (already done in the `Dockerfile`).

## 🚢 CI/CD / Registry

Example GitHub Actions snippet to build and push the image to Docker Hub or GHCR:

```yaml
# .github/workflows/docker-publish.yml
name: Build and push email-api

on:
   push:
      branches: [ main ]

jobs:
   build:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v4
         - name: Build and push
            uses: docker/build-push-action@v4
            with:
               push: true
               tags: myorg/salvemundi-email-api:latest
               context: ./email-api
```

## 🔧 Troubleshooting

- "Failed to get token": verify `MS_GRAPH_TENANT_ID`, `MS_GRAPH_CLIENT_ID`, `MS_GRAPH_CLIENT_SECRET` and that the client secret is valid.
- 401/403 errors: ensure `Mail.Send` application permission and admin consent in Azure AD. Sender mailbox must exist and be provisioned.
- Emails not arriving: check spam folder and server logs.

## 📚 Links

- [Azure App Registration Setup](../readme/AUTH_SETUP.md)
- [Microsoft Graph sendMail API](https://learn.microsoft.com/en-us/graph/api/user-sendmail)

---

If you'd like, I can also:
- Add a `docker-compose.yml` in this folder for local development
- Add GitHub Actions workflow for building and publishing images
- Add a minimal `.env.example` file with var descriptions

Would you like me to add any of those now?
