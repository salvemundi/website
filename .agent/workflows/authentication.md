---
description: De Inlog Workflow (Authenticatie)
---

Wanneer een bestaand lid inlogt, volgt het systeem deze stappen:

1. **Redirect naar Microsoft (AuthController::signIn)**:
   - De gebruiker klikt op de inlogknop.
   - De applicatie genereert een OAuth2 "Authorization URL" en stuurt de gebruiker naar de inlogpagina van Microsoft.
   - Er wordt een state tokens opgeslagen in de sessie om beveiligingsaanvallen (CSRF) te voorkomen.

2. **Callback verwerking (AuthController::callback)**:
   - Nadat de gebruiker bij Microsoft is ingelogd, wordt hij teruggestuurd naar `/callback` met een code.
   - De website wisselt deze code achter de schermen in voor een Access Token.
   - Met dit token haalt de server de gebruikersgegevens op bij Microsoft (via `/me`).

3. **Lokale Inlog**:
   - De server zoekt in de lokale tabel `users` naar de `AzureID` die Microsoft heeft teruggegeven.
   - **Gevonden**: De gebruiker wordt ingelogd in Laravel (`Auth::login`). Ook wordt er een lokale `api_token` gegenereerd (hash van het access token).
   - **Niet gevonden**: De inlog mislukt met de melding dat er geen gekoppeld account is gevonden.

### Admin Toegang
Middleware (`AdminAuth`) controleert of een gebruiker beheerdersrechten heeft op basis van hun commissie-rechten of specifieke permissies in de database.
