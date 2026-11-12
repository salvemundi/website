# Wie is de mol (kamp)

Losstaande Python-app (alleen standaardbibliotheek), los van de Next.js-site. Gebruik en spelregels: zie `HANDLEIDING.md` en `PRODUCT.md`.

## Draaien in de stack
- Image `ghcr.io/salvemundi/v7-wieisdemol`, gebouwd door `.github/workflows/v7-stack.yml` (context = repo-root, `apps/wieisdemol/Dockerfile`).
- Service `wieisdemol` in `docker-compose.yml`, alleen op `proxy-network` (geen database, geen andere services).
- Poort 8080 in de container. Gezondheidscheck: `/healthz`.
- Alle gegevens staan in het volume `wieisdemol_data` (`/data/state.json`). Dit volume blijft bestaan bij redeploys.

## Domeinen en omgevingen
Acceptance en productie zijn twee aparte instanties met elk een eigen spelstaat. Er worden geen gegevens tussen beide gedeeld.

| Omgeving | Domein | Container (doelwit voor Nginx Proxy Manager) |
|---|---|---|
| Acceptance | `acc-mol.salvemundi.nl` | `http://v7-acc-wieisdemol:8080` |
| Productie | `mol.salvemundi.nl` | `http://v7-prod-wieisdemol:8080` |

Maak in NPM per domein een Proxy Host met TLS en bij Advanced `client_max_body_size 6m;` (back-up terugzetten).
De app vertrouwt de **laatste** waarde van `X-Forwarded-For` (door de eigen proxy toegevoegd) voor de blokkade na 5 foute pincodes.
Het domein dat in het beheer als deelbare link wordt getoond, komt uit `WIEISDEMOL_URL` (gezet door de deploy-workflow).

## Gegevens blijven behouden
- Alles staat in het Docker-volume `<project>_wieisdemol_data` (`v7-acc_...` en `v7-prod_...`). Een deploy vervangt alleen de container, niet het volume.
- Bij elke start maakt de app een kopie van `state.json` in `/data/backups/` (de laatste 10 blijven bewaard).
- Het volume gaat pas verloren bij `docker compose down -v`, `docker volume rm` of als `COMPOSE_PROJECT_NAME` verandert. Doe dat nooit tijdens een kamp.
- Maak daarnaast na elke test een back-up via Beheer, Instellingen en back-up.

## Let op
- `/invul` heeft geen login: iedereen met de link kan een naam kiezen en een test maken. Deel de link alleen op het kamp.
- Kies een lange pincode (tot 12 cijfers) voor `/beheer`.
- Maak na elke test een back-up (Beheer → Instellingen en back-up).

## Lokaal
`python apps/wieisdemol/app/server.py` (poort 8080, gegevens in `apps/wieisdemol/app/data`).

## Aanpassen (voor ontwikkelaars)

### Wat staat waar
| Wil je... | Bestand |
|---|---|
| spelregels of de server aanpassen (afvallen, score, pincode, API) | `app/server.py` (alleen de Python-standaardbibliotheek, geen `pip install`) |
| het scherm van de kandidaten aanpassen | `app/static/invul.html` + `app/static/assets/invul.js` |
| het beheerscherm aanpassen | `app/static/beheer.html` + `app/static/assets/beheer.js` |
| kleuren, lettertypes of knoppen aanpassen | `app/static/assets/base.css` |
| de standaardvragen en proeven voor een **nieuw** spel wijzigen | `app/static/assets/standaard.json` |
| de startpagina wijzigen | `app/static/index.html` |
| uitleg voor de spelleiding | `HANDLEIDING.md` (de spelregels staan in `PRODUCT.md`) |

`standaard.json` wordt alleen gelezen als er een nieuw spel wordt aangemaakt. Een lopend spel pas je aan in het beheer (Vragen en antwoorden, Kandidaten, De mol).

### Lokaal draaien
Vereist Python 3.10 of nieuwer. Vanuit de repo-root:
```
python apps/wieisdemol/app/server.py
```
Open daarna `http://localhost:8080/beheer` (maak een spel aan met een pincode) en `http://localhost:8080/invul`. De gegevens staan lokaal in `apps/wieisdemol/app/data/` (staat in `.gitignore`); verwijder die map om opnieuw te beginnen.
- Wijzig je `html`, `js` of `css`: ververs de browser (de server cachet niet).
- Wijzig je `server.py`: stop de server (Ctrl+C) en start hem opnieuw.

Zo test je de container lokaal, vanuit de repo-root:
```
docker build -f apps/wieisdemol/Dockerfile -t wieisdemol .
docker run --rm -p 8080:8080 -v wieisdemol_data:/data wieisdemol
```

### Een wijziging uitrollen
1. Maak een branch vanaf `acceptance` en commit je wijziging.
2. Maak een pull request naar `acceptance`. Na de merge bouwt en deployt de workflow automatisch (die draait bij wijzigingen in `apps/wieisdemol/`). De wijziging staat daarna op `https://acc-mol.salvemundi.nl`.
3. Test daar de hele ronde: spel aanmaken, een test openzetten, invullen als kandidaat, uitslag vastzetten, onthulling.
4. Is het goed, maak dan een pull request van `acceptance` naar `main`. Daarna staat het op `https://mol.salvemundi.nl`.

Het uitrollen vervangt de container (een paar seconden niet bereikbaar). De spelgegevens blijven staan, ook na een nieuwe versie.

### Let op
- **Niet tijdens het kamp uitrollen**, tenzij het echt moet. Maak eerst een back-up (Beheer, Instellingen en back-up) en laat niemand midden in een test zitten.
- **Compatibel blijven met bestaande gegevens.** `state.json` wordt zoals hij is ingelezen. Voeg je een nieuw veld toe aan de spelstaat, zorg dan dat oude gegevens zonder dat veld blijven werken (zie `normalize()` in `beheer.js` en `new_state()` in `server.py`). Verwijder of hernoem bestaande velden niet zonder dat te regelen.
- **De server is de bron van waarheid** voor ingeleverde tests en starttijden. Het beheerscherm stuurt de hele spelstaat terug, maar kan die niet overschrijven (zie `api_put_state`). Houd dat zo.
- **Geen geheimen in de code of repo.** De app heeft er geen nodig; de pincode staat gehasht in de gegevens.
- Na het wijzigen van de opmaak: controleer ook op een telefoon en op de beamer (donker, grote letters), want daar wordt het gebruikt.

### Gegevens terugzetten
- Via het beheer: Instellingen en back-up, Back-up terugzetten (kies een eerder gedownload bestand).
- Via de server: er staan automatische kopieën in `/data/backups/` (bij elke start, de laatste 10). Kopieer er een naar `/data/state.json` en herstart de container.
