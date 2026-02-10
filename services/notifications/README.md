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
DIRECTUS_NOTIFICATION_KEY=your-directus-notification-key
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

### POST /notify-new-intro-blog

Stuur notificatie over een nieuwe intro blog.

```json
{
  "blogId": 456,
  "blogTitle": "Welkom bij de intro!"
}
```

### POST /notify-intro-signups

Stuur custom notificatie naar intro aanmeldingen en/of intro ouders.

```json
{
  "title": "Belangrijke update",
  "body": "De intro start morgen om 10:00!",
  "includeParents": true
}
```

**Note:** Aangezien intro aanmeldingen geen user accounts hebben, wordt de notificatie verstuurd naar alle gebruikers met push notificaties ingeschakeld. Als `includeParents` true is, worden ook intro ouders (die wel een account hebben) specifiek bereikt.

## Docker

```bash
docker build -t notification-api .
docker-compose up -d
```
