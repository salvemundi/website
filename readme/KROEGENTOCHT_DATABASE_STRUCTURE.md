# Kroegentocht Database Structuur

## Overzicht
Deze documenten beschrijft de benodigde database structuur voor de kroegentocht functionaliteit in Directus, inclusief de admin panel functionaliteit.

## Frontend Features

### Publieke Pagina
- **Locatie**: `/kroegentocht`
- Conditionele visibility via site_settings tabel
- Dynamische deelnemer-velden op basis van aantal tickets
- Automatische groepering van deelnemers
- Email bevestiging na inschrijving

### Admin Panel
- **Locatie**: `/admin/kroegentocht`
- Overzicht van alle kroegentocht events
- Automatische selectie van aanstaande kroegentocht
- Real-time statistieken:
  - Totaal aantal inschrijvingen
  - Totaal aantal verkochte tickets
  - Aantal verschillende verenigingen
- Excel export functionaliteit met groepsnummering
- Zoekfunctie op naam, email, en vereniging

### Admin Dashboard Widget
- Toont aantal aanmeldingen voor aanstaande kroegentocht
- Alleen zichtbaar wanneer er een aanstaande kroegentocht is
- Klikbaar om door te gaan naar de aanmeldingen pagina

## Tabellen

### 1. `pub_crawl_events`
Tabel voor het opslaan van verschillende kroegentocht evenementen.

**Velden:**
- `id` (Integer, Primary Key, Auto Increment)
- `name` (String, Required) - Naam van het evenement (bijv. "Kroegentocht Voorjaar 2026")
- `date` (Date, Required) - Datum van het evenement
- `description` (Text, Optional) - Beschrijving van het evenement
- `email` (String, Required) - Contact email voor het evenement
- `association` (String, Optional, Default: "Salve Mundi") - Organiserende vereniging
- `image` (UUID, Optional) - Header afbeelding voor het evenement (relation naar directus_files)
- `price` (Decimal, Optional) - Prijs per ticket
- `contact_name` (String, Optional) - Naam van contactpersoon
- `contact_phone` (String, Optional) - Telefoonnummer van contactpersoon
- `created_at` (Timestamp, Auto-generated)
- `updated_at` (Timestamp, Auto-updated)

**Relations:**
- `signups` (O2M relation naar `pub_crawl_signups`)

---

### 2. `pub_crawl_signups`
Tabel voor het opslaan van inschrijvingen voor kroegentochten.

**Velden:**
- `id` (Integer, Primary Key, Auto Increment)
- `pub_crawl_event_id` (Integer, Required) - Foreign key naar `pub_crawl_events`
- `name` (String, Required) - Naam van de persoon die inschrijft
- `email` (String, Required) - Email van de persoon die inschrijft
- `association` (String, Optional) - Vereniging van de inschrijver
- `amount_tickets` (Integer, Required, Min: 1, Max: 10, Default: 1) - Aantal tickets
- `name_initials` (JSON, Optional) - JSON array met namen en initialen van alle deelnemers
  ```json
  [
    { "name": "Jan", "initial": "D" },
    { "name": "Marie", "initial": "V" },
    { "name": "Piet", "initial": "S" }
  ]
  ```
- `created_at` (Timestamp, Auto-generated)
- `updated_at` (Timestamp, Auto-updated)

**Relations:**
- `pub_crawl_event_id` (M2O relation naar `pub_crawl_events`)

**Constraints:**
- Unique constraint op combinatie van `pub_crawl_event_id` + `email` (één inschrijving per email per evenement)

---

### 3. `site_settings`
Deze tabel bestaat al, maar moet een nieuwe row hebben voor de kroegentocht pagina.

**Benodigde Row:**
- `page`: `"kroegentocht"`
- `show`: `true/false` - Of de kroegentocht pagina zichtbaar is
- `disabled_message`: "De inschrijvingen voor de kroegentocht zijn momenteel gesloten." (of custom bericht)

---

## SQL Voorbeelden

### Pub Crawl Events Tabel Aanmaken (als nog niet bestaat)
```sql
CREATE TABLE IF NOT EXISTS pub_crawl_events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    email VARCHAR(255) NOT NULL,
    association VARCHAR(255) DEFAULT 'Salve Mundi',
    image UUID,
    price DECIMAL(10,2),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Pub Crawl Signups Tabel Aanmaken (als nog niet bestaat)
```sql
CREATE TABLE IF NOT EXISTS pub_crawl_signups (
    id SERIAL PRIMARY KEY,
    pub_crawl_event_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    association VARCHAR(255),
    amount_tickets INTEGER NOT NULL DEFAULT 1 CHECK (amount_tickets >= 1 AND amount_tickets <= 10),
    name_initials JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pub_crawl_event_id) REFERENCES pub_crawl_events(id) ON DELETE CASCADE,
    UNIQUE (pub_crawl_event_id, email)
);
```

### Site Settings Row Toevoegen
```sql
INSERT INTO site_settings (page, show, disabled_message)
VALUES ('kroegentocht', true, 'De inschrijvingen voor de kroegentocht zijn momenteel gesloten.')
ON CONFLICT (page) DO NOTHING;
```

---

## Directus Configuratie

### Collections Aanmaken in Directus UI

1. **pub_crawl_events Collection:**
   - Ga naar Settings > Data Model
   - Klik op "Create Collection"
   - Naam: `pub_crawl_events`
   - Voeg alle velden toe zoals hierboven beschreven
   - Configureer de M2O relatie naar directus_files voor de image field
   - Configureer de O2M relatie naar pub_crawl_signups voor signups

2. **pub_crawl_signups Collection:**
   - Ga naar Settings > Data Model
   - Klik op "Create Collection"
   - Naam: `pub_crawl_signups`
   - Voeg alle velden toe zoals hierboven beschreven
   - Configureer de M2O relatie naar pub_crawl_events
   - Stel validatie in: amount_tickets tussen 1-10
   - Maak unique constraint aan op (pub_crawl_event_id, email)

3. **site_settings Update:**
   - Ga naar Content > site_settings
   - Voeg een nieuwe row toe:
     - page: `kroegentocht`
     - show: `true`
     - disabled_message: "De inschrijvingen voor de kroegentocht zijn momenteel gesloten."

---

## Permissions in Directus

Zorg ervoor dat de volgende permissions correct zijn ingesteld:

### Public Role:
- **pub_crawl_events**: Read access (alleen voor velden: id, name, date, description, email, association, image)
- **pub_crawl_signups**: Create access (voor nieuwe inschrijvingen)
- **site_settings**: Read access (voor page visibility checks)

### Authenticated Role:
- Zelfde als Public Role + eventueel extra Read access voor eigen signups

### Administrator Role:
- Full CRUD access op alle tabellen

---

## Voorbeeld Data

### Voorbeeld Event:
```json
{
  "name": "Kroegentocht Voorjaar 2026",
  "date": "2026-04-15",
  "description": "De jaarlijkse voorjaars kroegentocht! Een avond vol plezier door verschillende kroegen in Eindhoven.",
  "email": "intro@salvemundi.nl",
  "association": "Salve Mundi",
  "price": 15.00,
  "contact_name": "Intro Commissie",
  "contact_phone": "+31612345678"
}
```

### Voorbeeld Signup:
```json
{
  "pub_crawl_event_id": 1,
  "name": "Jan Jansen",
  "email": "jan.jansen@student.fontys.nl",
  "association": "Salve Mundi",
  "amount_tickets": 3,
  "name_initials": [
    { "name": "Jan", "initial": "J" },
    { "name": "Marie", "initial": "V" },
    { "name": "Piet", "initial": "S" }
  ]
}
```

---

## Checklist voor Implementatie

- [ ] `pub_crawl_events` tabel aangemaakt met alle velden
- [ ] `pub_crawl_signups` tabel aangemaakt met alle velden
- [ ] Relaties geconfigureerd tussen de tabellen
- [ ] `name_initials` field is van type JSON
- [ ] Unique constraint toegevoegd op (pub_crawl_event_id, email)
- [ ] Site settings row toegevoegd voor 'kroegentocht'
- [ ] Permissions correct ingesteld
- [ ] Test event aangemaakt
- [ ] Test signup gedaan via de website
- [ ] Admin panel toegankelijk voor commissieleden
- [ ] Excel export getest

---

## Excel Export Functionaliteit

De Excel export genereert een bestand met drie kolommen:

1. **Naam**: Volledige naam + initiaal van achternaam (bijv. "Jan D.")
2. **Vereniging**: Naam van de vereniging
3. **Groep**: Nummer dat aangeeft welke mensen samen zijn aangemeld

### Voorbeeld Excel Output:
```
Naam            | Vereniging    | Groep
Jan D.          | Salve Mundi   | 1
Marie V.        | Salve Mundi   | 1
Piet S.         | Salve Mundi   | 1
Anna B.         | Proxy         | 2
Tom K.          | Proxy         | 2
Lisa M.         | Glow          | 3
```

In dit voorbeeld hebben Jan, Marie en Piet samen 3 tickets gekocht (groep 1), Anna en Tom hebben samen 2 tickets gekocht (groep 2), en Lisa heeft 1 ticket gekocht (groep 3).

---

## Admin Panel Toegang

Alleen gebruikers die lid zijn van een commissie hebben toegang tot het admin panel. De kroegentocht aanmeldingen pagina is beschikbaar voor alle commissieleden via:
- Direct: `/admin/kroegentocht`
- Via dashboard: klik op de "Kroegentocht Aanmeldingen" stat card

---

## Notities

- De `name_initials` field slaat een JSON array op met objecten die `name` en `initial` bevatten
- De `amount_tickets` moet overeenkomen met het aantal objecten in `name_initials`
- Bij het updaten van een bestaande signup wordt de oude signup overschreven (zie API logic)
- De unique constraint voorkomt dubbele inschrijvingen van hetzelfde email adres voor hetzelfde evenement
