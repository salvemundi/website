# Wie is de mol (kamp)

Losstaande Python-app (alleen standaardbibliotheek), los van de Next.js-site. Gebruik en spelregels: zie `HANDLEIDING.md` en `PRODUCT.md`.

## Draaien in de stack
- Image `ghcr.io/salvemundi/v7-wieisdemol`, gebouwd door `.github/workflows/v7-stack.yml` (context = repo-root, `apps/wieisdemol/Dockerfile`).
- Service `wieisdemol` in `docker-compose.yml`, alleen op `proxy-network` (geen database, geen andere services).
- Poort 8080 in de container. Gezondheidscheck: `/healthz`.
- Alle gegevens staan in het volume `wieisdemol_data` (`/data/state.json`). Dit volume blijft bestaan bij redeploys.

## Domein
De reverse proxy op de VPS moet `wieisdemol.salvemundi.nl` doorsturen naar
`http://v7-prod-wieisdemol:8080` (productie) of `http://v7-acc-wieisdemol:8080` (acceptance), met TLS en de header `X-Forwarded-For`.
De app vertrouwt de **laatste** waarde van `X-Forwarded-For` (door de eigen proxy toegevoegd) voor de blokkade na 5 foute pincodes.

## Let op
- `/invul` heeft geen login: iedereen met de link kan een naam kiezen en een test maken. Deel de link alleen op het kamp.
- Kies een lange pincode (tot 12 cijfers) voor `/beheer`.
- Maak na elke test een back-up (Beheer → Instellingen en back-up).
- Alleen één instantie is nodig. Acceptance en productie bouwen allebei dezelfde service; laat de proxy alleen naar één van de twee wijzen.

## Lokaal
`python apps/wieisdemol/app/server.py` (poort 8080, gegevens in `apps/wieisdemol/app/data`).
