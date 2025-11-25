# 📧 Salve Mundi - Email API Service

Dit is een dedicated microservice voor het verwerken van alle uitgaande e-mails van de Salve Mundi website en Directus. De service gebruikt Microsoft Graph API (via OAuth 2.0 Client Credentials) om veilig e-mails te versturen.

Dit service is geoptimaliseerd voor containerisatie en automatische deployment.

---

## 🛠️ Technologie & Functionaliteit

* **Runtime:** Node.js (v24 LTS - Alpine)
* **Mail Service:** Microsoft Graph API (OAuth 2.0)
* **Doel:** Veilige communicatie (via POST) en Kalender-feed (GET).

### API Endpoints

| Endpoint | Methode | Functie |
| :--- | :--- | :--- |
| `/send-email` | `POST` | Verstuurt e-mails via de geconfigureerde Microsoft 365 mailbox. |
| `/calendar` | `GET` | Genereert en serveert de iCal/ICS-feed van alle activiteiten. |
| `/health` | `GET` | Statuscontrole. |

---

## ⚙️ Configuratie (Environment Variables)

Deze variabelen zijn **cruciaal** en worden ingevuld door de GitHub Actions workflow (`deploy-email.yml`).

| Variabele | Omschrijving | Doel |
| :--- | :--- | :--- |
| `PORT` | Poort waarop de API draait. | Express listening port (`3001`). |
| `MS_GRAPH_TENANT_ID` | Azure AD Tenant ID. | Nodig voor authenticatie (Stap 1). |
| `MS_GRAPH_CLIENT_ID` | Client ID van de Entra App. | Nodig voor authenticatie (Stap 1). |
| `MS_GRAPH_CLIENT_SECRET` | Client Secret van de Entra App. | Nodig voor authenticatie (Stap 1). |
| `MS_GRAPH_SENDER_UPN` | UPN van de mailbox die gebruikt wordt om te versturen. | De afzender (bijv. `noreply@salvemundi.nl`). |
| `DIRECTUS_URL` | Endpoint van de Directus API. | Nodig voor het ophalen van de kalender data. |
| `DIRECTUS_API_KEY` | Token voor het lezen van Directus data. | Nodig voor kalender-feed toegang. |

---

## 🚢 CI/CD & Deployment

Deze service wordt beheerd door de GitHub Actions workflow: `.github/workflows/deploy-email.yml`.

### Deployment Strategie

* **Build:** De workflow bouwt de image op Node v24-alpine en pusht deze naar GHCR.
* **Secrets:** De geheime sleutels (MS Graph credentials, Directus keys) worden geladen via GitHub Secrets (`DEV_...` of `PROD_...`).
* **Orchestratie:** De container wordt op de server gestart met `docker compose --env-file .env.email up -d email-api` in de service-map.

**Om lokaal te testen:** Gebruik `npm install` gevolgd door `npm run dev` en vul een `.env` bestand handmatig in (niet committen).