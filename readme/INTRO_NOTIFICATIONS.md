# Intro Notificaties - Nieuwe Functies

## Overzicht

Er zijn twee nieuwe notificatie functies toegevoegd voor het intro systeem:

### 1. Automatische Notificaties voor Nieuwe Intro Blogs

Wanneer een nieuwe intro blog wordt aangemaakt en gepubliceerd in het admin paneel, wordt automatisch een push notificatie verstuurd naar alle gebruikers die notificaties hebben ingeschakeld.

**Implementatie:**
- Bij het aanmaken van een nieuwe blog in `/admin/intro` (Blogs tab)
- Notificatie wordt alleen verstuurd als de blog status "Gepubliceerd" is
- Alle gebruikers met push notificaties ingeschakeld ontvangen de melding
- Notificatie bevat: "📰 Nieuwe Intro Blog!" + blog titel
- Link naar `/intro/blog`

**Technische details:**
- API endpoint: `POST /api/notifications/send-intro-blog`
- Backend endpoint: `POST /notify-new-intro-blog` (notification-api)
- Implementatie: `/frontend/src/app/admin/intro/page.tsx` (handleSaveBlog functie)

### 2. Custom Notificaties voor Intro Aanmeldingen

Admins kunnen nu handmatig custom notificaties versturen naar intro deelnemers vanuit het admin paneel.

**Functies:**
- Verstuur custom berichten met eigen titel en tekst
- Optie om ook intro ouders (met account) te bereiken
- Bereikt alle gebruikers met push notificaties ingeschakeld
- Toegankelijk via een nieuwe knop bovenaan de `/admin/intro` pagina

**Hoe te gebruiken:**
1. Ga naar **Admin > Intro Beheer**
2. Klik op **"Verstuur Custom Notificatie"** knop (bovenaan de pagina)
3. Vul titel en bericht in
4. (Optioneel) Vink "Verstuur ook naar Intro Ouders" aan
5. Klik op **"Versturen"**

**Notitie:** Intro aanmeldingen zijn anoniem (zonder user account), dus de notificatie wordt verstuurd naar alle gebruikers met notificaties ingeschakeld. Als "Intro Ouders" is aangevinkt, worden gebruikers die als intro ouder zijn aangemeld specifiek bereikt.

**Technische details:**
- API endpoint: `POST /api/notifications/send-intro-custom`
- Backend endpoint: `POST /notify-intro-signups` (notification-api)
- UI: Modal dialog in `/frontend/src/app/admin/intro/page.tsx`

## Benodigde Permissies

Om deze functies te gebruiken, moet je toegang hebben tot het intro admin paneel:
- Rollen: `introcommissie`, `intro`, `ictcommissie`, `ict`, `bestuur`, `kandi`, `kandidaat`

## API Endpoints

### Frontend Proxy Routes (Next.js API Routes)

**Nieuwe Intro Blog Notificatie:**
```
POST /api/notifications/send-intro-blog
Body: { blogId: number, blogTitle: string }
```

**Custom Intro Notificatie:**
```
POST /api/notifications/send-intro-custom
Body: { 
  title: string, 
  body: string, 
  includeParents: boolean 
}
```

### Backend Notification API

**Nieuwe Intro Blog:**
```
POST https://notifications.salvemundi.nl/notify-new-intro-blog
Body: { blogId: number, blogTitle: string }
```

**Custom Intro Notificatie:**
```
POST https://notifications.salvemundi.nl/notify-intro-signups
Body: { 
  title: string, 
  body: string, 
  includeParents: boolean 
}
```

## Testing

### Stap 1: Test Nieuwe Blog Notificatie
1. Zorg dat je push notificaties hebt ingeschakeld op je device
2. Ga naar `/admin/intro` → Blogs tab
3. Klik op "Nieuwe Blog"
4. Vul een blog in en zet "Gepubliceerd" aan
5. Klik op "Opslaan"
6. Je zou een notificatie moeten ontvangen: "📰 Nieuwe Intro Blog!"

### Stap 2: Test Custom Notificatie
1. Ga naar `/admin/intro`
2. Klik op "Verstuur Custom Notificatie" (paarse knop bovenaan)
3. Vul een test titel en bericht in
4. Klik op "Versturen"
5. Je ontvangt een bevestiging met aantal verzonden notificaties
6. Controleer of je de notificatie hebt ontvangen

## Updates in Code

### Backend (notification-api)
- `/notification-api/server.js`: Twee nieuwe endpoints toegevoegd
- `/notification-api/README.md`: Documentatie bijgewerkt

### Frontend
- `/frontend/src/app/admin/intro/page.tsx`: Custom notificatie UI + automatische blog notificaties
- `/frontend/src/app/api/notifications/send-intro-blog/route.ts`: Nieuwe proxy route
- `/frontend/src/app/api/notifications/send-intro-custom/route.ts`: Nieuwe proxy route

## Troubleshooting

**Notificaties worden niet ontvangen:**
1. Controleer of push notificaties zijn ingeschakeld in je browser/device
2. Controleer of je bent ingelogd en een subscription hebt (zie Account pagina)
3. Check browser console voor errors
4. Controleer notification-api logs: `docker logs notification-api-prod`

**Foutmelding bij versturen:**
1. Check of notification-api draait: `docker ps | grep notification-api`
2. Controleer VAPID keys in environment variables
3. Check Directus connectie en API token
4. Bekijk server logs voor details

## Vergelijkbaar met Activiteiten Notificaties

Deze implementatie volgt hetzelfde patroon als bestaande activiteiten notificaties:
- Automatische notificaties bij nieuwe activiteiten (`/notify-new-event`)
- Herinneringen voor aanmeldingen (`/notify-event-reminder`)
- Custom notificaties per activiteit (`/send-custom`)

Het intro systeem heeft nu vergelijkbare functionaliteit voor blogs en algemene aankondigingen.
