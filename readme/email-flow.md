# Email API — Flow, Endpoints, and Usage

This document explains how the `email-api` service sends email and serves calendar feeds for the Salve Mundi website.

**Purpose**
- **What:** A small HTTP service that accepts email requests and sends messages via Microsoft Graph.
- **Where:** Service entry: `email-api/server.js`.

**High-level flow**
- Client (frontend or backend) POSTs JSON to `/send-email` or `/send-intro-update`.
- Server validates required fields and environment variables.
- Server requests an access token from Microsoft (client-credentials) and calls Microsoft Graph `sendMail` on behalf of a configured sender account.
- For newsletter/intro notifications the service optionally fetches an image and attaches it inline.
- The service exposes debug endpoints (`/send-email-debug`) and calendar endpoints (`/calendar`, `/calendar.ics`).

**Key files**
- `server.js` — main app and endpoints.
- `fix-json-parser.js` — fallback parser and sanitization for malformed JSON (smart quotes).
- `docker-compose.yml`, `Dockerfile` — containerization.

Endpoints
- `GET /health` — basic health-check.
- `POST /send-email` — send a single email using Microsoft Graph.
  - Required JSON fields: `to`, `subject`, `html`.
  - Optional: `from`, `fromName`, `attachments` (see Attachments below).
- `POST /send-email-debug` — same request shape but logs and echoes the payload without calling Graph (useful locally).
- `POST /send-intro-update` — bulk email to subscribers; accepts `{ blogTitle, blogExcerpt, blogUrl, blogImage, subscribers }` and sends an intro/newsletter style message.
- `GET /calendar` and `GET /calendar.ics` — generates an iCalendar feed by fetching events from Directus.
- `GET /calendar/debug` — returns raw events fetched from Directus for debugging.
- `GET /.well-known/webcal` — redirects to the calendar feed (webcal convenience).

Request shapes
- Basic `POST /send-email` JSON example:

```json
{
  "to": "alice@example.com",
  "subject": "Welcome to Salve Mundi",
  "html": "<p>Welkom!</p>",
  "from": "organizer@example.com",
  "attachments": [
    {
      "name": "invite.pdf",
      "contentType": "application/pdf",
      "contentBytes": "<BASE64-PDF>",
      "isInline": false
    }
  ]
}
```

- `attachments` expected shape (for Microsoft Graph `fileAttachment`):
  - `name` (string)
  - `contentType` (string, e.g. `image/png`)
  - `contentBytes` (base64 string)
  - `isInline` (boolean)
  - `contentId` (optional, required for inline `cid:` references)

Security and behavior notes
- The service requires Microsoft Graph client credentials (client credentials flow) and sends mail using a configured service mailbox (`MS_GRAPH_SENDER_UPN`).
- The API will set `from` in the Graph payload to the configured sender account and optionally add a `replyTo` to preserve the client-supplied `from` address.
- Do not rely on client-provided `from` to select the Graph `user` — the app must have rights to send as the chosen mailbox.

CORS
- The server uses a whitelist of allowed origins; in development you may set `CORS_ALLOW_ALL=true` (debug only).

Environment variables
- `MS_GRAPH_TENANT_ID` — Azure tenant id (required)
- `MS_GRAPH_CLIENT_ID` — Azure app client id (required)
- `MS_GRAPH_CLIENT_SECRET` — Azure app client secret (required)
- `MS_GRAPH_SENDER_UPN` — mailbox used to send mail (defaults to `noreply@salvemundi.nl`)
- `MS_GRAPH_SENDER_NAME` — display name for the sender (optional)
- `DIRECTUS_URL` — base URL for Directus (used by calendar)
- `DIRECTUS_API_TOKEN` — API token for Directus (used by calendar)
- `PORT` — server port (defaults to `3001`)
- `CORS_ALLOW_ALL` — set to `true` to allow all origins (development only)

Running locally
- Install dependencies and start in dev mode:

```bash
cd email-api
npm install
npm run dev
```

- Or run production:

```bash
npm start
```

Docker
- A `Dockerfile` and `docker-compose.yml` exist in the `email-api` folder; the service can be containerized and provided with the environment variables above.

Examples
- Send a debug email (no external call):

```bash
curl -X POST http://localhost:3001/send-email-debug \
  -H "Content-Type: application/json" \
  -d '{"to":"you@example.com","subject":"test","html":"<p>test</p>"}'
```

- Minimal send (production) — the server will exchange credentials for an access token and call Graph:

```bash
curl -X POST https://email.example.com/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"you@example.com","subject":"hi","html":"<p>Hello</p>"}'
```

Troubleshooting
- If you see `Missing required environment variables` ensure `MS_GRAPH_*` vars are set.
- Use `/send-email-debug` to verify the request payload and attachments handling without consuming Graph calls.
- Check logs for CORS origin blocks; the server logs blocked origins.

Retention and sent items
- The code sets `saveToSentItems: false` when calling Graph to avoid populating the sender mailbox's Sent Items. Adjust if you want sent items persisted.

Notes for contributors
- Keep secrets outside the repo (use env files or secrets manager).
- Prefer calling `/send-email-debug` when developing templates to avoid spamming real recipients.

Appendix — Useful files
- `email-api/server.js` — main app and endpoints.
- `email-api/fix-json-parser.js` — JSON sanitization helper.
- `email-api/docker-compose.yml` — container orchestration (if present in your environment).

---
Generated from analysis of the `email-api` service code (server.js) — update this doc if you change endpoint behavior or payload shapes.
