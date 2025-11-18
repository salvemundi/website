# Email Notificatie Systeem

## Overzicht

De website heeft een email notificatie systeem dat automatisch emails verstuurt bij belangrijke events:
- **Activiteit aanmeldingen**: Bevestiging naar de gebruiker + notificatie naar de organisatie
- **Lidmaatschap aanmeldingen**: Notificatie naar de organisatie

## Configuratie

### Environment Variabelen

Voeg de volgende variabelen toe aan je `.env` bestand:

```bash
# Email API Endpoint (verplicht voor email functionaliteit)
VITE_EMAIL_API_ENDPOINT=https://jouw-email-api.com/send

# Email afzender configuratie (optioneel - standaard waarden worden gebruikt)
VITE_EMAIL_FROM=noreply@salvemundi.nl
VITE_EMAIL_FROM_NAME=Salve Mundi
```

### Email API Endpoint Opties

Je hebt verschillende opties voor het email endpoint:

#### Optie 1: Directus Flow (Aanbevolen)
Als je Directus gebruikt, kun je een Directus Flow maken die emails verstuurt via Directus SMTP configuratie.

**Voordeel**: Gecentraliseerde email configuratie, server-side security, logging
**Endpoint**: `https://admin.salvemundi.nl/flows/trigger/YOUR-FLOW-ID`

📖 **Zie gedetailleerde setup instructies**: [DIRECTUS_EMAIL_FLOW.md](./DIRECTUS_EMAIL_FLOW.md)

#### Optie 2: SendGrid API
Gebruik SendGrid voor email delivery met hoge deliverability.

**Endpoint**: `https://api.sendgrid.com/v3/mail/send`
**API Key**: Configureer in de headers van de requests

#### Optie 3: Custom Email Service
Maak een eigen microservice die emails verstuurt via SMTP of een email provider.

**Voorbeeld endpoint**: `https://api.salvemundi.nl/send-email`

#### Optie 4: Serverless Function (Vercel, Netlify, etc.)
Deploy een serverless function die emails verstuurt.

**Voorbeeld voor Vercel**: `/api/send-email`

### Email API Request Format

De email service verwacht dat de API de volgende JSON structuur accepteert:

```json
{
  "to": "ontvanger@example.com",
  "from": "noreply@salvemundi.nl",
  "fromName": "Salve Mundi",
  "subject": "Email onderwerp",
  "html": "<html>Email body in HTML</html>"
}
```

## Implementatie Details

### Email Types

#### 1. Activiteit Aanmelding Email
**Trigger**: Wanneer iemand zich aanmeldt voor een activiteit via de winkelwagen

**Twee emails worden verstuurd**:
1. **Bevestiging naar gebruiker**: 
   - Bevat activiteit details (naam, datum, prijs)
   - Studentnummer (indien opgegeven)
   
2. **Notificatie naar organisatie**:
   - Alle bovenstaande informatie
   - Plus email en naam van de aanmelder

#### 2. Lidmaatschap Aanmelding Email
**Trigger**: Wanneer iemand het lidmaatschap formulier invult

**Email naar organisatie**:
- Persoonlijke gegevens (naam, email, telefoon)
- Geboortedatum (indien opgegeven)
- Favoriete GIF (als afbeelding in email)

### Error Handling

Het email systeem is gebouwd met **graceful degradation**:
- Als de email API niet geconfigureerd is, wordt een waarschuwing gelogd maar blijft de functionaliteit werken
- Als het versturen van een email faalt, wordt de fout gelogd maar de aanmelding blijft succesvol
- Gebruikers krijgen geen foutmelding als alleen de email faalt

Dit zorgt ervoor dat de website blijft werken zelfs zonder email configuratie.

## Testing

### Test zonder Email Configuratie
1. Laat `VITE_EMAIL_API_ENDPOINT` leeg in je `.env`
2. Aanmeldingen werken normaal, maar emails worden niet verstuurd
3. Check de browser console voor waarschuwingen

### Test met Email Configuratie
1. Configureer `VITE_EMAIL_API_ENDPOINT` met je email API
2. Meld je aan voor een activiteit of lidmaatschap
3. Check of emails zijn ontvangen
4. Check de browser console voor succesmeldingen of fouten

### Test Email API Response
Je kunt de email API testen met curl:

```bash
curl -X POST https://jouw-email-api.com/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "from": "noreply@salvemundi.nl",
    "fromName": "Salve Mundi",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

## Voorbeeld Email API Implementation

Hier is een voorbeeld van hoe je een simpele email API kunt maken met Node.js en Nodemailer:

```javascript
// api/send-email.js (bijvoorbeeld voor Vercel)
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, from, fromName, subject, html } = req.body;

  // Configureer SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      html,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
```

## Toekomstige Uitbreidingen

Het email systeem is ontworpen om gemakkelijk uitgebreid te worden voor:
- Wachtwoord reset emails
- Evenement herinneringen
- Nieuwsbrieven
- Betalingsbevestigingen
- Welkom emails voor nieuwe leden

Om nieuwe email types toe te voegen, voeg gewoon een nieuwe functie toe aan `src/lib/email-service.ts`.

## Beveiliging

⚠️ **Belangrijke beveiligingsoverwegingen**:

1. **API Keys**: Sla nooit API keys op in de frontend code. Gebruik een backend endpoint dat de emails verstuurt.
2. **Rate Limiting**: Implementeer rate limiting op je email API om misbruik te voorkomen.
3. **Email Validatie**: De frontend valideert emails, maar valideer ook op de backend.
4. **Spam Preventie**: Overweeg CAPTCHA voor publieke formulieren.

## Troubleshooting

### Emails komen niet aan
- Check of `VITE_EMAIL_API_ENDPOINT` correct is geconfigureerd
- Controleer browser console voor fouten
- Test de email API direct met curl
- Check spam folder bij email providers

### CORS fouten
- Zorg dat je email API CORS headers retourneert
- Of gebruik een backend endpoint op hetzelfde domein

### Emails komen aan in spam
- Configureer SPF, DKIM en DMARC records voor je domein
- Gebruik een betrouwbare email service provider
- Vermijd spam trigger woorden in subject en body

## Support

Voor vragen over de email configuratie, neem contact op met het development team.
