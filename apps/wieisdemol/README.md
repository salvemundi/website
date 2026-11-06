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
