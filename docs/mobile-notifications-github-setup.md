# Handmatige notificatie-setup via bestaande GitHub deployment

Gebruik de bestaande workflow `Deploy V7 Stack` (`v7-stack.yml`) met **branch acceptance** en kies `mobile_setup_action`. De standaardwaarde `none` houdt de bestaande website-uitrol intact. Alle andere keuzes slaan de normale bouw- en uitroljobs over en roepen de afzonderlijke `Acceptance mobile notifications setup` aan. Deze werkt uitsluitend bij een handmatige dispatch op acceptance, binnen de bestaande GitHub-omgeving Acceptance, met dezelfde NetBird- en strikt gecontroleerde SSH-hostidentiteit. Er is geen production setup-pad.

## Vaste acties

- `check`: bouwt alleen een lokaal, aan de exacte commit gekoppeld notificatiewerker-image en voert de alleen-lezen doctor uit. Er worden geen instellingen of databasegegevens gewijzigd en geen notificaties verzonden. Stagingbestanden en het lokale image worden wel aangemaakt. De doctor meldt onvolledige setup als een mislukte controle; het is geen algemene serverdiagnose.
- `configure`: valideert de APNs-sleutel cryptografisch en schrijft uitsluitend `/opt/salve-mundi-v7/.env.mobile-acc`, atomair met rechten 600. Meldingsbezorging blijft **uit**, productie-APNs blijft uit en de werker wordt niet gestart. De bestaande `.env.acc` en productie worden niet aangepast.
- `migrate`: past uitsluitend de gereviewde `packages/db/drizzle/mobile_notifications.sql` van de gekozen commit toe. Vereist de expliciete `mobile_confirm_isolation`-bevestiging en de onderstaande harde databasecontroles. Start geen werker.
- `start`: vereist dezelfde isolatiebevestiging en een volledig geslaagde doctor. Start uitsluitend de container `v7-acc-mobile-notifications`, met de expliciete testledenlijst en sandbox-APNs. Alleen deze aparte workercontainer wordt vervangen. De bezorggate wordt alleen bij deze expliciete actie ingeschakeld. Geen automatische herstart na een fout.

- `test`: vereist isolatiebevestiging en een geslaagde doctor. Voert uitsluitend de vaste `src/test-delivery.mjs` uit voor één expliciet toegestaan, actief testaccount met een geldig gekoppeld sandbox-toestel. Geen eigen tekst, productie-APNs of brede ontvangerslijst. Deze actie start geen werker en verandert geen databasegegevens. Een door Apple geaccepteerd verzoek is nog geen bewijs dat het toestel de melding heeft weergegeven.

## Vereiste GitHub Acceptance-geheimen

Naast de bestaande NetBird/SSH-geheimen: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`. Deel of log de privésleutel nooit. Voor de eerste pilot bevat `MOBILE_NOTIFICATION_TEST_EMAIL` uitsluitend het expliciet goedgekeurde testaccount. Bij `configure` wordt dit account met een exacte, geparameteriseerde, alleen-lezen zoekopdracht tegen actieve accounts in de acceptatiedatabase naar één UUID omgezet. Alleen die UUID wordt in de testledenlijst opgeslagen; het e-mailadres wordt niet opgeslagen of afgedrukt. Geen wildcard en geen overige gebruikerslijst worden opgevraagd.

Een operator kan later expliciete test-UUIDs via `mobile_test_user_ids` gebruiken; dit mag niet gecombineerd worden met het e-mailgeheim. Een lege lijst is toegestaan voor configuratie, maar kan de doctor/start nooit laten slagen. Zo kan de sleutel worden voorbereid terwijl bezorging uit blijft.

## Databasebescherming

Het script leest uitsluitend `DB_NAME` uit de bestaande `.env.prod`, vergelijkt met `.env.acc` en verifieert via `SELECT current_database()` dat de feitelijk verbonden database exact acceptance is en verschilt van productie. Gedeelde databases stoppen de setup; een bevestigingsvinkje omzeilt deze controle niet. Databasecredentials komen uitsluitend uit `.env.acc`. Alleen benodigde variabelen worden zonder shell-evaluatie naar een tijdelijk bestand met rechten 600 gekopieerd; omringende dotenv-aanhalingstekens worden verwijderd en wachtwoordtekens blijven letterlijk. Het bestand wordt ook na fouten verwijderd. Secrets en ruwe driverfouten worden niet afgedrukt.

De eerste migratie vereist een door de operator gecontroleerde back-up. Controleer de eerste `check` en configureer daarna in afzonderlijke, bewuste stappen. Een geslaagde doctor bewijst nog geen werkelijke bezorging. Voer na start een gecontroleerde test op het goedgekeurde toestel uit. Stop de aparte workercontainer om bezorging direct stil te leggen. Promotie naar productie of TestFlight-productie-APNs behoort niet tot deze setup.
