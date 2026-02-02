# Notification API

Push notification service voor de Salve Mundi PWA app.

## Setup

### 1. Genereer VAPID keys

```bash
npx web-push generate-vapid-keys
```

### 2. Configureer environment variables

Voeg toe aan `.env`:

```env
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=info@salvemundi.nl
DIRECTUS_URL=https://admin.salvemundi.nl
DIRECTUS_API_TOKEN=your-directus-token
```

### 3. Maak push_notification collectie in Directus

In Directus, maak een nieuwe collectie `push_notification` met de volgende velden:

- `id` (UUID, Primary Key)
- `user_id` (Many-to-One relatie met directus_users, nullable)
- `endpoint` (String, required)
- `keys` (JSON, required)
- `user_agent` (String)
- `created_at` (DateTime)
- `last_used` (DateTime)

### 4. Start de service

```bash
npm install
npm start
```

## API Endpoints

### GET /vapid-public-key
Haal de publieke VAPID key op voor frontend gebruik.

### POST /subscribe
Abonneer een gebruiker op push notificaties.

```json
{
  "subscription": {
    "endpoint": "...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
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
Stuur een custom notificatie.

```json
{
  "userIds": ["uuid1", "uuid2"],  // optional, stuur naar specifieke users
  "title": "Notificatie titel",
  "body": "Notificatie bericht",
  "data": {
    "url": "/activiteit/123"
  },
  "icon": "/icon.png",  // optional
  "tag": "custom-tag"   // optional
}
```

### POST /notify-new-event
Stuur notificatie over een nieuwe activiteit.

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

## Docker

```bash
docker build -t notification-api .
docker-compose up -d
```
