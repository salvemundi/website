# Directus Email Flow Setup

Deze guide laat zien hoe je een Directus Flow kunt maken om emails te versturen vanuit de website.

## Waarom Directus Flows?

Directus Flows bieden:
- ✅ **Server-side email sending**: Veilig zonder API keys in frontend
- ✅ **Gecentraliseerde configuratie**: SMTP instellingen in Directus
- ✅ **Logging**: Alle emails worden gelogd in Directus
- ✅ **Gemakkelijke testing**: Test emails direct vanuit Directus admin
- ✅ **Rate limiting**: Ingebouwde beveiliging tegen misbruik

## Setup Stappen

### 1. Configureer SMTP in Directus

Voeg SMTP configuratie toe aan je Directus `.env`:

```bash
EMAIL_FROM="noreply@salvemundi.nl"
EMAIL_TRANSPORT="smtp"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-email@gmail.com"
EMAIL_SMTP_PASSWORD="your-app-password"
EMAIL_SMTP_SECURE="false"
```

### 2. Maak een Directus Flow

1. **Log in op Directus Admin**: `https://admin.salvemundi.nl`

2. **Ga naar Flows**: Settings → Flows → Create Flow

3. **Flow Configuratie**:
   - **Name**: `Send Email`
   - **Status**: Active
   - **Trigger**: Webhook
   - **Method**: POST
   - **Async**: No (we willen direct response)

4. **Noteer de Webhook URL**: 
   - Na opslaan krijg je een URL zoals: `https://admin.salvemundi.nl/flows/trigger/abc123-def456`

### 3. Voeg Operations toe aan de Flow

#### Operation 1: Log Request (Optioneel voor debugging)

- **Type**: Log to Console
- **Message**: `Email request received: {{$trigger.body}}`

#### Operation 2: Send Email

- **Type**: Send Email
- **To**: `{{$trigger.body.to}}`
- **From**: `{{$trigger.body.from}}` of gebruik `{{$env.EMAIL_FROM}}`
- **Subject**: `{{$trigger.body.subject}}`
- **Body**: `{{$trigger.body.html}}`
- **Type**: HTML

#### Operation 3: Return Success Response

- **Type**: Webhook Response
- **Status Code**: 200
- **Body**: 
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### 4. Configureer Website Environment Variable

Update je `.env` bestand:

```bash
VITE_EMAIL_API_ENDPOINT=https://admin.salvemundi.nl/flows/trigger/abc123-def456
```

Vervang `abc123-def456` met je eigen Flow trigger ID.

## Request Format

De website verstuurt emails met dit JSON formaat:

```json
{
  "to": "recipient@example.com",
  "from": "noreply@salvemundi.nl",
  "fromName": "Salve Mundi",
  "subject": "Email Subject",
  "html": "<html>Email body</html>"
}
```

## Advanced: Error Handling Flow

Voor betere error handling, voeg een extra operation toe:

#### Operation 4: Handle Errors (Conditional)

- **Type**: Condition
- **Rule**: Check if email sending failed
- **Then**: 
  - Log error
  - Return error response with status 500

## Testing

Test je flow direct vanuit Directus:

1. Ga naar je Flow
2. Klik op de Play button (▶️) bij Trigger
3. Voer test data in:

```json
{
  "to": "test@example.com",
  "from": "noreply@salvemundi.nl",
  "fromName": "Salve Mundi",
  "subject": "Test Email",
  "html": "<h1>Dit is een test email</h1>"
}
```

4. Check of de email is ontvangen

## Security Best Practices

1. **Rate Limiting**: Voeg rate limiting toe aan je Flow (max 100 emails per uur bijvoorbeeld)

2. **Email Validatie**: Voeg validatie toe voor email adressen:
   ```javascript
   // In een Run Script operation
   if (!$trigger.body.to || !$trigger.body.to.includes('@')) {
     return {
       error: 'Invalid email address'
     };
   }
   ```

3. **Whitelist Domains**: Beperk emails naar alleen specifieke domeinen als je wilt:
   ```javascript
   const allowedDomains = ['salvemundi.nl', 'fontys.nl'];
   const domain = $trigger.body.to.split('@')[1];
   if (!allowedDomains.includes(domain)) {
     return {
       error: 'Domain not allowed'
     };
   }
   ```

4. **CORS**: Configureer CORS in Directus om alleen je website domein toe te staan:
   - Settings → Project Settings → Security → CORS
   - Voeg toe: `http://localhost:5173`, `https://salvemundi.nl`

## Alternatief: Directus Extension

Als je meer controle wilt, kun je een Directus Extension maken:

```bash
cd extensions
npm create directus-extension@latest
# Kies: endpoint
# Naam: send-email
```

Implementeer de endpoint in `src/index.js`:

```javascript
export default (router, { services, exceptions }) => {
  router.post('/send-email', async (req, res) => {
    const { MailService } = services;
    const { ServiceUnavailableException } = exceptions;
    
    try {
      const mailService = new MailService({ schema: req.schema });
      
      await mailService.send({
        to: req.body.to,
        from: req.body.from,
        subject: req.body.subject,
        html: req.body.html,
      });
      
      res.json({ success: true });
    } catch (error) {
      throw new ServiceUnavailableException(error.message);
    }
  });
};
```

Dan gebruik je: `VITE_EMAIL_API_ENDPOINT=https://admin.salvemundi.nl/send-email`

## Troubleshooting

### Emails komen niet aan

1. **Check SMTP configuratie** in Directus `.env`
2. **Test SMTP verbinding** met Directus testing tool
3. **Check Flow logs** in Directus voor fouten
4. **Controleer spam folder**

### CORS errors

- Zorg dat je domein is toegevoegd aan CORS whitelist in Directus
- Check browser console voor specifieke CORS fouten

### 401 Unauthorized

- De Flow trigger moet **publiekelijk toegankelijk** zijn (geen authenticatie vereist)
- Check Flow settings → Trigger → Require Authentication = OFF

## Support

Voor meer info over Directus Flows:
- [Directus Flows Documentation](https://docs.directus.io/configuration/flows/)
- [Directus Email Configuration](https://docs.directus.io/self-hosted/config-options.html#email)
