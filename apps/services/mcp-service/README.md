# mcp-service — Samu Bijbel (alleen lezen)

> **⚠ Niet productieklaar.** Nog niet getest tegen de echte tenant/site (zie "Open punten"). Het bronadres bevat `bijbel-concept`; of dat de bedoelde productiebron is, is **niet vastgesteld**.

Remote MCP-server (Streamable HTTP, stateless, `POST /mcp`) waarmee een AI-assistent de **gepubliceerde** Samu Bijbel (SharePoint) kan zoeken en lezen. Geen generatief model, geen schrijfpad.

## Wat dit wel en niet garandeert
- De server levert **letterlijke brontekst met titel, bronlink, pagina-ID, sectie en wijzigingsdatum**, en meldt expliciet "niet gevonden" of "bron niet bereikbaar" in plaats van iets aan te vullen. Cachegegevens zijn gemarkeerd (`bron_status: "cache"`, `opgehaald_op`). Is het zoekbereik beperkt, dan staat dat in het antwoord (`zoekbereik_beperkt`) en wordt geen afwezigheid geclaimd.
- De server **kan niet garanderen dat een extern AI-model nooit iets verzint**. Hij kan alleen betrouwbare brongegevens en duidelijke instructies (server-`instructions`, tool-omschrijvingen, `let_op`-veld) aanleveren. Controleer antwoorden aan de hand van de bronlinks.
- Paginainhoud wordt als onbetrouwbare data behandeld; instructies in pagina's veranderen tools of toegangsregels niet.

## Tools (vast, alleen lezen; namen gelijk aan de bestaande koppeling)
| Tool | Doel |
|---|---|
| `lijst_bijbel_paginas` (`limit`, `cursor`) | Pagina-ID's, titels, bronlinks, wijzigingsdatum (gepagineerd) |
| `lees_bijbel_pagina` (`pagina_id` (UUID), `sectie`, `cursor`) | Letterlijke tekst van één pagina, gepagineerd |
| `zoek_in_bijbel` (`query`, `limit`, `cursor`) | Letterlijk zoeken op trefwoord in max. 50 pagina's (`MCP_MAX_SEARCH_PAGES`) |
| `lijst_sjablonen` (`limit`, `cursor`) | Bestanden uit de sjablonenmap (`MCP_FILES_PATH`, default `/Sjablonen` in de standaard documentbibliotheek van de site), recursief tot 3 niveaus/300 bestanden |
| `lees_sjabloon` (`bestand_id`, `cursor`) | Letterlijke **tekst** van één bestand uit die map, gepagineerd. Word (`.docx`/`.dotx`), PowerPoint (`.pptx`/`.potx`, tekst per dia), pdf (tekstlaag per pagina, max. 100 pagina's, 20 s; een gescande pdf zonder tekst levert niets) en tekst (`.txt`/`.md`/`.csv`); geen opmaak, afbeeldingen of invulvelden. Max. `MCP_MAX_FILE_BYTES` (3 MB), zip-bommen worden vooraf geweigerd. |

| `download_sjabloon` (`bestand_id`, `cursor`) | **Originele bytes** van één bestand uit die map als base64 in delen van 12 000 bytes (met `sha256_totaal`), zodat een assistent met code-uitvoering een kopie met behoud van opmaak kan invullen. Elk bestandstype, max. `MCP_MAX_DOWNLOAD_BYTES` (default 256 KB, max. 1 MB). De server parset niets; alleen bestanden uit de lijst zijn opvraagbaar. |

### Prompts (werkwijzen die de gebruiker in de client kiest)
| Prompt | Doel |
|---|---|
| `beantwoord_vraag` (`vraag`) | Zoekt in de Bijbel en antwoordt met bronvermelding; zegt expliciet als het er niet in staat |
| `controleer_tegen_bijbel` (`tekst`) | Toetst een tekst of plan aan regels en afspraken, met citaat en bron per punt |
| `vul_sjabloon_in` (`sjabloon`, `gegevens`) | Zoekt en leest een sjabloon, vraagt ontbrekende gegevens en levert een ingevulde kopie in de chat (alleen beschikbaar als de bestandstools actief zijn) |

Prompts bevatten alleen instructies en de door de gebruiker ingevulde argumenten; ze geven geen extra toegang.

Een nieuw bestand wordt door de AI-assistent in de chat gemaakt op basis van de gelezen tekst; er wordt **niets naar SharePoint geschreven**. De rechten zijn gelijk aan die voor pagina's (`Sites.Selected`, rol `read`, namens de gebruiker). Het eerste segment van `MCP_FILES_PATH` wordt eerst als **documentbibliotheek** van de site gezocht (op weergavenaam, bv. een eigen bibliotheek `Sjablonen`); de rest is een map daarin. Bestaat zo'n bibliotheek niet, dan is het een map in de standaardbibliotheek. Optionele GitHub-variabelen: `MCP_FILES_PATH` (default `/Sjablonen`) en `MCP_MAX_DOWNLOAD_BYTES` (default 262144; door compose en workflow doorgegeven).

De bewerk- en uploadtools van de bestaande koppeling zijn **bewust niet overgenomen**. Er zijn geen tools of routes voor schrijven, uploaden, commando's of vrije URL's/paden. Bij pagina's worden alleen tekstwebonderdelen van moderne SharePoint-pagina's gelezen: geen bijlagen, afbeeldingen, klassieke pagina's of dynamische webonderdelen. Links in pagina's worden niet gevolgd.

## Architectuur: OAuth + On-Behalf-Of
1. De gebruiker meldt zich aan bij Entra; de MCP-client haalt een token op met scope `api://<MCP_ENTRA_CLIENT_ID>/bijbel.read`.
2. De server valideert dat token (handtekening via tenant-JWKS, RS256, issuer, **audience = eigen app**, expiry, scope `bijbel.read`, `tid` = eigen tenant). Alleen gedelegeerde tokens (`scp`) zijn geldig; app-only tokens en tokens voor andere diensten (ook voor de bestaande bewerk-app) worden geweigerd. **Alleen leden**: tokens van gastaccounts (B2B; `idp` van een andere tenant/provider, of optionele claim `acct` ≠ 0) krijgen 403 `forbidden`, los van de gebruikerstoewijzing in Entra.
3. De server wisselt het token via On-Behalf-Of om voor een Graph-token (`OnBehalfOfCredential`) en doet uitsluitend `GET` naar `graph.microsoft.com/v1.0/sites/{vast site-ID}/pages…` (strikt gevalideerd, `redirect: error`).
4. Microsoft vereist dat zowel de app (`Sites.Selected` gedelegeerd + expliciete site-grant) als de gebruiker toegang heeft. Bij 401/403 geeft de tool een generieke "geen toegang"-fout, wordt de cache van die gebruiker gewist en wordt **nooit** automatisch een bredere permissie geprobeerd of stale data getoond.
5. Alleen pagina's met `publishingState.level = published` binnen `MCP_ALLOWED_PATH_PREFIX` zijn leesbaar; een ontbrekende status telt als niet gepubliceerd. De status wordt bij het lezen van de pagina nogmaals gecontroleerd. Pagina-ID's buiten die allowlist zijn niet leesbaar.
6. Cache is in-memory en **per gebruiker** gescheiden (max. 50 gebruikers, TTL 5 min, max. stale 1 uur, expliciet gemarkeerd). Een pagina die Graph als verwijderd meldt (404) wordt nooit uit de cache geserveerd. OBO-Graph-tokens worden per gebruikerstoken bewaard tot 2 min vóór vervallen.

Overig: Host-/Origin-validatie, rate limit **per gebruiker** (`MCP_RATE_LIMIT_PER_MINUTE`, na tokencontrole; Claude/ChatGPT delen egress-IP's) plus een ruime limiet per IP (`MCP_IP_RATE_LIMIT_PER_MINUTE`; 60/min op de browserroutes `/authorize` en `/oauth/callback`), 64 KB body-limiet, time-outs, maximaal aantal gelijktijdige verzoeken totaal (`MCP_MAX_CONCURRENT`) en per gebruiker (`MCP_MAX_CONCURRENT_PER_USER`, default 3). Geen querystrings of headers in de logs.
Bestanden: zips worden vóór het uitpakken gecontroleerd op de *echte* uitgepakte grootte (een zip die over zijn groottes liegt wordt geweigerd); pdf's worden pagina voor pagina gelezen (max. 100) met een deadline van 10 s; geëxtraheerde tekst is begrensd op 1 000 000 tekens; tekstnabewerking is lineair (geen kwadratische regexen).
Container: non-root, read-only rootfs, `cap_drop: ALL`, `no-new-privileges`, geheugen/CPU/pids-limiet, alleen `proxy-network`, **geen `env_file`**, geen volumes, geen gepubliceerde poort.

## Alleen-lezen, op meerdere niveaus
- **Tools/routes:** alleen leestools (pagina's en sjablonen) en prompts; geen schrijfroutes.
- **Config:** `BIJBEL_WRITE_ENABLED` staat in compose vast op `false`; een andere waarde laat de service niet starten.
- **Bron:** de Graph-client kan alleen `GET`.
- **Bronrechten:** een **afzonderlijke app met alleen leesrechten** (zie hieronder). Dit laatste is niet vanuit de repo af te dwingen; het is een Entra-inrichting die een beheerder moet doen en controleren.

## Configuratie per omgeving
GitHub Environment (`Acceptance` / `Production`). Zonder `MCP_ENABLED=true` wordt de service niet gestart (`COMPOSE_PROFILES=mcp`). Er zijn geen defaults voor site, app of secret.

| Naam | Type | Omschrijving |
|---|---|---|
| `MCP_ENABLED` | var | `true` om de service in deze omgeving te deployen |
| `MCP_PUBLIC_URL` | var | Vast HTTPS-adres, bv. `https://mcp.acc.salvemundi.nl` (voorstel; nog niet bestaand) |
| `MCP_ENTRA_CLIENT_ID` | var | Client-ID van de **nieuwe, alleen-lezen** app (resource + OBO-client) |
| `MCP_ENTRA_CLIENT_SECRET` | secret | Client secret van die app (niet in Git; alleen via GitHub Secrets) |
| `AZURE_WEBSITEV7_TENANT_ID` | secret (bestaand) | Tenant-ID; controleer dat dit gelijk is aan de bedoelde tenant |
| `MCP_SHAREPOINT_SITE_ID` | var | Graph site-ID van de Bijbel-site **van deze omgeving** |
| `MCP_ALLOWED_PATH_PREFIX` | var (optioneel) | bv. `/sites/<site>/SitePages/`; default `/` |
| `MCP_ALLOWED_ORIGINS` | var (optioneel) | toegestane `Origin`s van browser-clients |

Tuning (env, defaults in `src/config.ts`): `MCP_CACHE_TTL_SECONDS`, `MCP_MAX_STALE_SECONDS`, `MCP_MAX_RESPONSE_CHARS`, `MCP_MAX_RESULTS`, `MCP_MAX_SEARCH_PAGES` (≤50), `MCP_RATE_LIMIT_PER_MINUTE` (per gebruiker), `MCP_IP_RATE_LIMIT_PER_MINUTE` (per IP, alle routes), `MCP_MAX_CONCURRENT`, `MCP_MAX_CONCURRENT_PER_USER`, `MCP_REQUEST_TIMEOUT_MS`.

### Opgegeven gegevens (identificatoren, geen geheimen; niet door ons geverifieerd)
- Site: `https://salvemundi.sharepoint.com/sites/bijbel-concept`
- Tenant-ID: `b2faad5e-45d0-4bb5-ae35-8f745204bbeb`
- Bestaande appregistratie (**bewerk-capabele koppeling**): `39a7165e-8a84-473b-9986-4ab84099dee6`
- Site-ID: `salvemundi.sharepoint.com,9a2c3e99-1ba5-4ac6-9891-b73780d9e05f,c0d0e2da-30a0-472c-a229-baf9e9e39836`

Deze zijn **bewust nergens als default ingesteld**. Aanbevolen verdeling: de `bijbel-concept`-site hooguit voor **Acceptance** gebruiken, na bevestiging dat het een test-/conceptsite is; voor **Production** een door de eigenaar bevestigde site opgeven. Wijs een site-URL niet zelf aan: de naam "concept" suggereert dat het niet de productiebron is.

## Entra-inrichting (eenmalig, door een beheerder; per omgeving)
Omdat de bestaande app (`39a7165e-…`) ook bewerken/uploaden mogelijk maakt, krijgt deze dienst een **eigen** identiteit; de rechten van de bestaande app worden niet gewijzigd. Een token voor de bestaande app wordt door deze dienst geweigerd (getest).
1. Nieuwe app `Samu-Bijbel-MCP-ReadOnly`: *Expose an API* met app-ID-URI `api://<client-id>` en scope `bijbel.read`; `accessTokenAcceptedVersion = 2`; client secret aanmaken en in GitHub Secrets zetten.
2. Alleen gedelegeerde Graph-permissie `Sites.Selected` + admin consent. **Geen** `Sites.Read.All`/`ReadWrite.All`, geen `Files.*`.
3. Per omgeving uitsluitend de bijbehorende site vrijgeven met rol `read`: `POST /sites/{site-id}/permissions` met `{"roles":["read"],"grantedToIdentities":[{"application":{"id":"<client-id>","displayName":"Samu-Bijbel-MCP-ReadOnly"}}]}`; controleer met `GET …/permissions` dat er geen `write`/`owner` staat.
4. Pre-registreer de MCP-client(s) en geef alleen de bedoelde gebruikers/groepen toegang (assignment required). De gebruikers hebben daarnaast zelf leestoegang tot de site nodig.

## OAuth-voorportaal (gebruikers vullen geen client-ID/secret in)
Entra ondersteunt geen dynamic client registration. Daarom is deze dienst zelf de autorisatieserver richting MCP-clients (`/.well-known/oauth-authorization-server`, `/register`, `/authorize`, `/oauth/callback`, `/token`; zie `src/oauth/proxy.ts`). Gebruikers plakken alleen `https://<host>/mcp` in Claude en melden zich aan met hun Microsoft-account.
- `/register` geeft een stateless client_id (versleuteld, bevat de toegestane redirect-URI's). Toegestaan: `MCP_ALLOWED_REDIRECT_URIS` (default `https://claude.ai/api/mcp/auth_callback` en `https://claude.com/api/mcp/auth_callback`) en http-loopback.
- `/authorize` toont eerst een **toestemmingspagina** (welke client, welke redirect-host, "ga alleen door als je dit zelf startte"). Dit is verplicht voor een proxy met dynamische registratie en een vast upstream-client-ID (MCP security best practices, *confused deputy*): Entra meldt stil aan via SSO, dus een doorgestuurde link zou anders ongemerkt een code voor andermans connector opleveren. Een `__Host-`-cookie met nonce (ook in de versleutelde state) bindt de flow aan deze browser; de callback zonder bijbehorende cookie wordt geweigerd. Pas na "Doorgaan" (POST, same-origin) volgt de doorverwijzing naar Entra met het echte client-ID, vaste scope `api://<client-id>/bijbel.read offline_access`, PKCE S256 verplicht naar de client, en **zonder** `resource`-parameter (voorkomt AADSTS9010010). Een `resource` van de client die niet deze server is, geeft `invalid_target`.
- `/token` wisselt codes en refresh tokens uitsluitend server-side in met het Entra client secret; access tokens van Entra worden doorgegeven en door de bestaande validatie (audience, scope, OBO) gecontroleerd. Het secret verlaat de server nooit. **Refresh tokens** gaan versleuteld en gebonden aan het client_id naar de client; een kaal Entra-refresh-token of dat van een andere client wordt geweigerd. Storing of throttling bij Entra (5xx/429) geeft 503 `temporarily_unavailable` (client probeert later opnieuw) in plaats van `invalid_grant`.
- Geen opslag: state en codes zijn versleuteld/geauthenticeerd (AES-GCM, sleutel afgeleid van het client secret), state 10 min, code 2 min. Entra dwingt eenmalig gebruik van de code af. Na roteren van het secret moeten gebruikers opnieuw inloggen.
- Entra-app: voeg bij **Authentication → Web** de redirect-URI `https://<host>/oauth/callback` toe. De **Application ID URI** blijft `api://<client-id>` (geen https-URL). Er is geen aparte client-app of publieke client nodig.

## Redirect URI en hosting
De enige redirect-URI in Entra is de eigen callback `https://<host>/oauth/callback` (zie hierboven). Claude's eigen callback hoeft niet in Entra. De lokale testserver met tunnel uit de bestaande documentatie wordt niet hergebruikt; er is nog geen vast productieadres aangetoond.

Nginx Proxy Manager (config staat niet in de repo, handmatig): `mcp.acc.salvemundi.nl` → `http://v7-acc-mcp:3005`; `mcp.salvemundi.nl` → `http://v7-prod-mcp:3005` (hostnamen zijn een voorstel). TLS (Let's Encrypt), Force SSL, `Host`-header ongewijzigd doorsturen. `/health` mag extern bereikbaar zijn (alleen `{"status":"ok"}`, handig voor een uptime-check).

## Clientconfiguratie
Remote MCP-server-URL `https://<MCP_PUBLIC_URL host>/mcp`; OAuth authorization code + PKCE; scope `api://<client-id>/bijbel.read`. De autorisatieserver staat in `/.well-known/oauth-protected-resource`.

## Open punten (vóór ingebruikname)
1. **Pages-API met gedelegeerde `Sites.Selected` is nog niet in de tenant getest.** Test op Acceptance met een echte gebruiker: lijst, lees, zoek. Bij een 403 geeft de dienst "geen toegang"; voeg dan **niet** automatisch bredere rechten toe maar onderzoek de site-grant en gebruikersrechten.
2. De paginastructuur (`canvasLayout`, `publishingState`) is gebaseerd op de Graph-documentatie en niet tegen de echte site getest. Controleer o.a. dat `publishingState` in de lijst-response aanwezig is; zo niet, dan blijft de lijst leeg (fail-closed).
3. Welke site de productiebron is, moet de eigenaar bevestigen.
4. Client secret, site-IDs en DNS per omgeving instellen (placeholders; niets staat in Git).

## Lokaal ontwikkelen en testen
```
pnpm --filter=@salvemundi/mcp-service type-check
pnpm --filter=@salvemundi/mcp-service lint
pnpm --filter=@salvemundi/mcp-service test
```
Tests gebruiken lokaal gegenereerde sleutels en gemockte Graph/OBO; er is geen verbinding met Entra of SharePoint.

## Rollback
- Uitzetten: `MCP_ENABLED=false` in het GitHub Environment en de workflow opnieuw draaien, of op de VPS `docker compose --env-file .env.<acc|prod> rm -sf mcp-service`.
- Vorige versie: `IMAGE_TAG` terug naar de vorige `ghcr.io/salvemundi/v7-mcp`-image.
- Toegang intrekken: site-grant of client secret van de nieuwe app verwijderen/roteren in Entra.
- De rest van de stack is onafhankelijk (eigen compose-profiel, geen `depends_on`).
