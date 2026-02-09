# Directus Collection Audit per Service

Dit document bevat een volledig overzicht van alle collectie-namen die in de broncode van de verschillende API's worden genoemd.

## 1. Payment API (`payment-api`)
**Gevonden namen in code**: `transactions`, `event_signups`, `pub_crawl_signups`, `pub_crawl_tickets`, `trip_signups`, `trips`, `trip_signup_activities`, `trip_activities`, `users`, `coupons`, `site_settings`, `committees`, `committee_members`, `pub_crawl_events`.

### ✅ Vereist (Niet overbodig)
- `transactions`: Essentieel voor het aanmaken en bijwerken van betalingen.
- `event_signups`: Bijwerken van betaalstatus na succesvolle Mollie betaling.
- `pub_crawl_signups`: Bijwerken van betaalstatus voor de kroegentocht.
- `pub_crawl_tickets`: Aanmaken van individuele QR-tickets na betaling.
- `trip_signups`: Bijwerken van aanbetaling/restbetaling status.
- `trips`: Ophalen van basisprijzen van de reis ter controle.
- `trip_signup_activities`: Lezen welke opties/activiteiten de tripper heeft gekozen.
- `trip_activities`: Prijzen ophalen van de bijbehorende activiteiten.
- `users` (Systeem): Aanmaken van nieuwe leden en koppelen van betalingen.
- `coupons`: Valideren van kortingscodes en verhogen van verbruik (`usage_count`).
- `site_settings`: Controleren of handmatige goedkeuring actief is.
- `committees` & `committee_members`: Controleren op commissie-lidmaatschap voor korting.

### ❌ Overbodig (Redundant)
- `pub_crawl_events`: Staat wel in de `collections.js` constanten, maar wordt niet direct via de API aangeroepen in de huidige `payment-api` logica.

---

## 2. Admin API (`admin-api`)
**Gevonden namen in code**: `transactions`, `users`, `site_settings`, `roles`.

### ✅ Vereist (Niet overbodig)
- `transactions`: Voor het handmatig goedkeuren of afkeuren van aanmeldingen door het bestuur.
- `users` (Systeem): Beheren van accountgegevens en het koppelen van Entra ID's.
- `site_settings`: Aanpassen van systeemconfiguratie.

### ❌ Overbodig (Redundant)
- `roles` (Systeem): Hoewel rollen worden gecheckt in de middleware, gebeurt dit via het `/users/me` endpoint. De API roept de `/roles` collectie zelf niet rechtstreeks aan.

---

## 3. Graph Sync (`graph-sync`)
**Gevonden namen in code**: `users`, `committees`, `committee_members`, `club_members`.

### ✅ Vereist (Niet overbodig)
- `users` (Systeem): Synchroniseren van profielinformatie (status, namen, avatars) vanuit Microsoft Entra.
- `committees`: Synchroniseren van de namen en ID's van commissies/groepen.
- `committee_members`: Het belangrijkste endpoint voor het synchroniseren van wie in welke commissie zit.

### ❌ Overbodig (Redundant)
- `club_members`: Wordt nog genoemd in de sync-logica maar lijkt een legacy collectie die niet meer actief data bevat of synchroniseert.

---

## 4. Notification API (`notification-api`)
**Gevonden namen in code**: `push_notification`, `events`, `event_signups`, `intro_parent_signups`, `users`.

### ✅ Vereist (Niet overbodig)
- `push_notification`: Volledig beheer (CRUD) van browser-tokens.
- `events`: Ophalen van details voor "Nieuwe activiteit" meldingen.
- `event_signups`: Zoeken van deelnemers voor herinneringen.
- `intro_parent_signups`: Specifieke meldingen sturen naar intro-ouders.
- `users` (Systeem): Koppelen van push-tokens aan de juiste Directus gebruiker.

### ❌ Overbodig (Redundant)
- Geen. Alle gevonden collecties zijn actief in gebruik.

---

## 5. Email API (`email-api`)
**Gevonden namen in code**: `events`.

### ✅ Vereist (Niet overbodig)
- `events`: Alleen nodig voor het genereren van de openbare ICS (iCal) agenda feed.

### ❌ Overbodig (Redundant)
- Geen.
