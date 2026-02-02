# Push Notificaties Setup Guide

Deze guide helpt je met het opzetten van push notificaties voor de Salve Mundi PWA app.

## Overzicht

Het notificatie systeem bestaat uit:
1. **notification-api** - Backend service voor het beheren van subscriptions en versturen van notificaties
2. **Service Worker** - Ontvangt en toont push notificaties in de browser
3. **Frontend Components** - UI voor gebruikers om notificaties in/uit te schakelen
4. **Admin Interface** - Voor het versturen van notificaties per activiteit

## Stap 1: Directus Database Setup

Maak een nieuwe collectie aan in Directus met de naam `push_subscriptions`:

### Velden:

| Veld naam | Type | Opties |
|-----------|------|--------|
| `id` | UUID | Primary Key, auto-generated |
| `user_id` | UUID | Many-to-One relatie met `directus_users` (nullable) |
| `endpoint` | String | Required, unique |
| `keys` | JSON | Required |
| `user_agent` | String | Nullable |
| `created_at` | DateTime | Auto-filled on create |
| `last_used` | DateTime | Nullable |

### Permissions:

Zorg ervoor dat de Directus API token toegang heeft tot deze collectie (create, read, update, delete).

## Stap 2: VAPID Keys Genereren

VAPID (Voluntary Application Server Identification) keys zijn nodig voor Web Push.

```bash
cd notification-api
npx web-push generate-vapid-keys
```

Dit genereert:
```
Public Key: <PUBLIC_KEY>
Private Key: <PRIVATE_KEY>
```

## Stap 3: Environment Variables

### notification-api/.env

```env
PORT=3003
VAPID_PUBLIC_KEY=<jouw-public-key>
VAPID_PRIVATE_KEY=<jouw-private-key>
VAPID_EMAIL=info@salvemundi.nl
DIRECTUS_URL=https://admin.salvemundi.nl
DIRECTUS_API_TOKEN=<jouw-directus-token>
NODE_ENV=production
```

### frontend/.env.local

```env
NEXT_PUBLIC_NOTIFICATION_API_URL=https://notifications.salvemundi.nl
```

Of voor development:
```env
NEXT_PUBLIC_NOTIFICATION_API_URL=http://localhost:3003
```

## Stap 4: Notification API Opstarten

### Development

```bash
cd notification-api
npm install
npm start
```

### Production (Docker)

```bash
cd notification-api
docker-compose up -d
```

Zorg ervoor dat de `TAG` environment variabele is ingesteld (`dev` of `latest`).

## Stap 5: Frontend Configuratie

De frontend is al geconfigureerd, maar controleer:

1. **Service Worker** (`frontend/public/sw.js`) - Bevat push event handlers
2. **Push Service** (`frontend/src/shared/lib/services/push-notification-service.ts`) - Client-side API
3. **Notificatie Toggle** (`frontend/src/components/NotificationToggle.tsx`) - UI component
4. **Account Pagina** - Bevat de notificatie toggle

## Stap 6: Testen

### 1. Test de Notification API

```bash
curl http://localhost:3003/health
```

Expected response:
```json
{
  "status": "ok",
  "vapidConfigured": true
}
```

### 2. Test Push Subscription

1. Open de website in je browser
2. Ga naar `/account`
3. Klik op "Notificaties inschakelen"
4. Accepteer de notificatie permissie
5. Controleer in Directus of een nieuwe record is aangemaakt in `push_subscriptions`

### 3. Test Notificatie Versturen

**Via Admin Interface:**
1. Ga naar `/admin/activiteiten`
2. Bij een activiteit, klik op "Herinnering" of "Custom"
3. Verstuur een test notificatie

**Via API:**
```bash
curl -X POST http://localhost:3003/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notificatie",
    "body": "Dit is een test bericht",
    "data": {
      "url": "/"
    }
  }'
```

## Stap 7: Reverse Proxy Setup (Productie)

Voeg een reverse proxy configuratie toe voor de notification API:

### Nginx voorbeeld:

```nginx
location /api/notifications/ {
    proxy_pass http://notification-api-latest:3003/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Of maak een subdomain: `notifications.salvemundi.nl`

## Gebruik

### Voor Gebruikers

1. **Notificaties inschakelen**
   - Ga naar Account pagina
   - Klik op de notificatie toggle
   - Accepteer browser permissies

2. **Notificaties ontvangen**
   - Automatisch bij nieuwe activiteiten
   - Herinneringen voor activiteiten waar je voor bent aangemeld
   - Custom berichten van admins

### Voor Admins

1. **Herinnering sturen**
   - Ga naar Admin > Activiteiten
   - Klik op "Herinnering" bij een activiteit
   - Bevestig

2. **Custom bericht sturen**
   - Ga naar Admin > Activiteiten
   - Klik op "Custom" bij een activiteit
   - Vul titel en bericht in
   - Verstuur

3. **Automatische notificatie bij nieuwe activiteit**
   - Wordt automatisch verstuurd wanneer een nieuwe activiteit wordt aangemaakt

## API Endpoints

### GET /vapid-public-key
Haal de publieke VAPID key op voor frontend gebruik.

### POST /subscribe
Abonneer een gebruiker op push notificaties.

```json
{
  "subscription": {
    "endpoint": "...",
    "keys": { "p256dh": "...", "auth": "..." }
  },
  "userId": "uuid-optional"
}
```

### POST /unsubscribe
Verwijder een push subscription.

```json
{
  "endpoint": "..."
}
```

### POST /send
Stuur een custom notificatie naar alle gebruikers of specifieke gebruikers.

```json
{
  "userIds": ["uuid1", "uuid2"],  // optional
  "title": "Notificatie titel",
  "body": "Notificatie bericht",
  "data": { "url": "/activiteit/123" },
  "icon": "/icon.png",  // optional
  "tag": "custom-tag"   // optional
}
```

### POST /notify-new-event
Stuur notificatie over een nieuwe activiteit naar alle geabonneerde gebruikers.

```json
{
  "eventId": 123
}
```

### POST /notify-event-reminder
Stuur herinnering naar gebruikers die zijn aangemeld voor een activiteit.

```json
{
  "eventId": 123
}
```

## Troubleshooting

### Notificaties worden niet ontvangen

1. **Controleer browser support**
   - Chrome, Edge, Firefox ondersteunen Web Push
   - Safari ondersteunt Web Push vanaf versie 16.4

2. **Controleer permissies**
   - Browser instellingen > Site instellingen > Notificaties
   - Moet op "Toestaan" staan

3. **Controleer service worker**
   - Open DevTools > Application > Service Workers
   - Zorg dat de service worker actief is

4. **Controleer subscription**
   - Kijk in Directus of een subscription bestaat
   - Endpoint moet geldig zijn

### VAPID errors

- Zorg dat VAPID keys correct zijn ingesteld in environment variables
- Gebruik dezelfde keys voor development en productie
- Als je keys wijzigt, moeten gebruikers opnieuw subscriben

### CORS errors

- Controleer CORS configuratie in notification-api
- Voeg je frontend domain toe aan `allowedOrigins`

## Browser Compatibility

| Browser | Push Notifications | Service Workers |
|---------|-------------------|-----------------|
| Chrome  | ✅ | ✅ |
| Edge    | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari  | ✅ (16.4+) | ✅ |
| Opera   | ✅ | ✅ |

## Beveiliging

- VAPID keys moeten geheim blijven
- Gebruik HTTPS in productie (vereist voor Web Push)
- Valideer alle input in de notification API
- Rate-limit API endpoints om spam te voorkomen

## Monitoring

Monitor deze metrics:
- Aantal active subscriptions
- Notificatie delivery rate
- Failed subscriptions (410/404 errors)
- API response times

## Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
