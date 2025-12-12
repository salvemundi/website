const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS with a flexible origin check. In production, prefer
// explicitly listing allowed origins. For quick debugging set
// CORS_ALLOW_ALL=true in the env to allow requests from any origin.
const allowedOrigins = [
  'http://localhost:5173',
  'https://salvemundi.nl',
  'https://www.salvemundi.nl',
  'https://dev.salvemundi.nl'
];

// Reusable CORS options so we can apply the same policy to preflight
// responses handled by express. This ensures OPTIONS responses include
// the Access-Control-* headers the browser expects.
const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (e.g. curl or server-side) allow it
    if (!origin) return callback(null, true);

    // Allow everything when CORS_ALLOW_ALL is set (debugging only)
    if (process.env.CORS_ALLOW_ALL === 'true') return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  // Allow common headers that clients send (Authorization for example)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  // Ensure browsers get a 204 for successful preflight
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Explicitly respond to all preflight requests using the same cors policy
// so that Access-Control-Allow-* headers are always present on OPTIONS.
app.options('*', cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug endpoint: echo request headers, useful to call from a browser
// to verify the request reaches this process and which Origin header is sent.
app.get('/debug-headers', (req, res) => {
  console.log('🔍 /debug-headers called', { origin: req.headers.origin, host: req.headers.host });
  res.json({
    ok: true,
    method: req.method,
    path: req.path,
    origin: req.headers.origin || null,
    headers: req.headers,
  });
});

// Ensure preflight requests to /send-email are handled and logged
app.options('/send-email', (req, res) => {
  console.log('📨 OPTIONS preflight for /send-email', { origin: req.headers.origin, acao: req.headers['access-control-request-method'] });
  // Let cors middleware set proper headers; just reply with 204 No Content
  res.sendStatus(204);
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    // Log some request metadata to help diagnose 404s coming from browsers
    console.log('Incoming /send-email request', {
      origin: req.headers.origin,
      host: req.headers.host,
      method: req.method,
      path: req.path,
      contentLength: req.headers['content-length'],
    });

    const { to, subject, html, from, fromName, attachments } = req.body || {};

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log('📧 Sending email to:', to);

    // Step 1: Validate required environment variables
    const requiredVars = {
      'MS_GRAPH_TENANT_ID': process.env.MS_GRAPH_TENANT_ID,
      'MS_GRAPH_CLIENT_ID': process.env.MS_GRAPH_CLIENT_ID,
      'MS_GRAPH_CLIENT_SECRET': process.env.MS_GRAPH_CLIENT_SECRET,
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error('❌', errorMsg);
      return res.status(500).json({
        error: 'Email service configuration error',
        details: errorMsg,
      });
    }

    console.log('✅ Environment variables validated');
    console.log('🔑 Using tenant:', process.env.MS_GRAPH_TENANT_ID);

    // Step 2: Get access token from Microsoft
    const tokenUrl = `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`;
    console.log('🔐 Requesting token from:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MS_GRAPH_CLIENT_ID,
        client_secret: process.env.MS_GRAPH_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Token request failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        url: tokenUrl,
        error: error
      });
      throw new Error(`Failed to get token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Got access token');

    // Step 3: Send email via Graph API
    // Use the configured service account (MS_GRAPH_SENDER_UPN) as the mailbox
    // used for sending. Do NOT rely on client-provided `from` to select the
    // Graph user because that will cause ErrorInvalidUser if the user does
    // not exist or the app has no rights to send as that user.
    const senderEmail = process.env.MS_GRAPH_SENDER_UPN || from || 'noreply@salvemundi.nl';
    const senderName = process.env.MS_GRAPH_SENDER_NAME || fromName || 'Salve Mundi';
    console.log('Using sender for Graph API:', { senderEmail, senderName });

    const emailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
        // Explicitly set the 'from' in the message body to the configured sender
        from: {
          emailAddress: {
            address: senderEmail,
            name: senderName,
          },
        },
      },
      saveToSentItems: false,
    };

    // If the client supplied a different `from` address, add it as replyTo
    // so replies go to the client-specified mailbox while the Graph send is
    // performed by the configured sender account.
    if (from && from !== senderEmail) {
      emailPayload.message.replyTo = [
        {
          emailAddress: {
            address: from,
          },
        },
      ];
    }

    // Add attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.message.attachments = attachments.map((attachment) => {
        const attachmentObj = {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachment.name,
          contentType: attachment.contentType,
          contentBytes: attachment.contentBytes,
          isInline: Boolean(attachment.isInline),
        };

        // Add contentId for inline attachments (required for cid: references)
        if (attachment.isInline && attachment.contentId) {
          // Ensure contentId is in the correct format
          attachmentObj.contentId = attachment.contentId;
        }

        return attachmentObj;
      });

      console.log('📎 Prepared attachments:', emailPayload.message.attachments.map(att => ({
        name: att.name,
        contentType: att.contentType,
        isInline: att.isInline,
        contentId: att.contentId,
        bytesLength: att.contentBytes ? att.contentBytes.length : 0,
      })));
    }

    console.log('📤 Sending to Graph API...');

    const sendResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      }
    );

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Graph API error:', errorText);
      return res.status(sendResponse.status).json({
        error: 'Failed to send email',
        details: errorText,
      });
    }

    console.log('✅ Email sent successfully!');

    res.json({
      success: true,
      message: 'Email sent successfully',
      sentTo: to,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Intro update notification endpoint
app.post('/send-intro-update', async (req, res) => {
  try {
    console.log('📧 Intro update notification requested');

    const { blogTitle, blogExcerpt, blogUrl, blogImage } = req.body || {};

    if (!blogTitle || !blogUrl) {
      return res.status(400).json({
        error: 'Missing required fields: blogTitle, blogUrl'
      });
    }

    // Fetch subscribers from Directus
    const directusUrl = process.env.DIRECTUS_URL || 'https://admin.salvemundi.nl';
    const directusToken = process.env.DIRECTUS_API_KEY;

    if (!directusToken) {
      return res.status(500).json({ error: 'Directus API key not configured' });
    }

    const subscribersResponse = await fetch(
      `${directusUrl}/items/intro_newsletter_subscribers?filter[is_active][_eq]=true&fields=email`,
      {
        headers: {
          'Authorization': `Bearer ${directusToken}`
        }
      }
    );

    if (!subscribersResponse.ok) {
      throw new Error(`Failed to fetch subscribers: ${subscribersResponse.statusText}`);
    }

    const subscribersData = await subscribersResponse.json();
    const subscribers = subscribersData.data || [];

    if (subscribers.length === 0) {
      return res.json({
        success: true,
        message: 'No active subscribers found',
        sentCount: 0
      });
    }

    // Get access token (reuse logic from /send-email)
    const tokenUrl = `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MS_GRAPH_CLIENT_ID,
        client_secret: process.env.MS_GRAPH_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Send email to each subscriber
    const senderUpn = process.env.MS_GRAPH_SENDER_UPN || 'noreply@salvemundi.nl';
    const emailsToSend = subscribers.map(sub => sub.email);
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7B2CBF 0%, #FF6B35 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nieuwe Intro Update!</h1>
          </div>
          
          ${blogImage ? `
            <div style="width: 100%; height: 250px; overflow: hidden;">
              <img src="${blogImage}" alt="${blogTitle}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          ` : ''}
          
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 12px 12px;">
            <h2 style="color: #7B2CBF; margin-top: 0;">${blogTitle}</h2>
            
            ${blogExcerpt ? `
              <p style="font-size: 16px; color: #555; line-height: 1.8;">
                ${blogExcerpt}
              </p>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${blogUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #7B2CBF 0%, #FF6B35 100%); 
                        color: white; text-decoration: none; padding: 14px 32px; 
                        border-radius: 25px; font-weight: bold; font-size: 16px;">
                Lees meer →
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              We hopen je snel te zien tijdens de introweek!<br>
              <strong>Het Salve Mundi Intro Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>
              Je ontvangt deze email omdat je bent ingeschreven voor intro updates.<br>
              <a href="${blogUrl.replace('/blog', '')}" style="color: #7B2CBF;">Uitschrijven</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const emailPayload = {
      message: {
        subject: `Intro Update: ${blogTitle}`,
        body: {
          contentType: 'HTML',
          content: emailHtml
        },
        toRecipients: emailsToSend.map(email => ({
          emailAddress: { address: email }
        })),
        from: {
          emailAddress: {
            address: senderUpn
          }
        }
      },
      saveToSentItems: false
    };

    const sendUrl = `https://graph.microsoft.com/v1.0/users/${senderUpn}/sendMail`;
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      throw new Error(`Failed to send email: ${sendResponse.statusText} - ${error}`);
    }

    console.log(`✅ Intro update email sent to ${emailsToSend.length} subscribers`);

    res.json({
      success: true,
      message: 'Intro update emails sent successfully',
      sentCount: emailsToSend.length
    });

  } catch (error) {
    console.error('❌ Intro update notification error:', error);
    res.status(500).json({
      error: 'Failed to send intro update notifications',
      message: error.message
    });
  }
});

// Calendar feed endpoint
app.get('/calendar', async (req, res) => {
  try {
    console.log('📅 Calendar feed requested');

    // Fetch events from Directus
    const directusUrl = process.env.DIRECTUS_URL || 'https://admin.salvemundi.nl';
    const directusToken = process.env.DIRECTUS_API_KEY;

    if (!directusToken) {
      return res.status(500).json({ error: 'Directus API key not configured' });
    }

    const eventsResponse = await fetch(
      `${directusUrl}/items/events?fields=id,name,event_date,description,location&sort=-event_date&limit=-1`,
      {
        headers: {
          'Authorization': `Bearer ${directusToken}`
        }
      }
    );

    if (!eventsResponse.ok) {
      throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.data || [];

    // Generate ICS content
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Salve Mundi//Website//NL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Salve Mundi Activiteiten',
      'X-WR-TIMEZONE:Europe/Amsterdam',
      'X-WR-CALDESC:Alle activiteiten van Salve Mundi',
    ];

    events.forEach(event => {
      const startDate = new Date(event.event_date);
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      const now = new Date();

      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const escapeText = (text) => {
        if (!text) return '';
        return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
      };

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@salvemundi.nl`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${escapeText(event.name)}`,
        `DESCRIPTION:${escapeText(event.description || '')}`,
        `LOCATION:${escapeText(event.location || 'Salve Mundi')}`,
        `URL:https://salvemundi.nl/activiteiten?event=${event.id}`,
        'END:VEVENT'
      );
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    // Set headers for calendar subscription
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="salve-mundi.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(icsContent);

    console.log(`✅ Calendar feed served with ${events.length} events`);
  } catch (error) {
    console.error('❌ Calendar feed error:', error);
    res.status(500).json({
      error: 'Failed to generate calendar feed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email API server running on port ${PORT}`);
  console.log(`📧 Ready to send emails via Microsoft Graph`);
  console.log(`📅 Calendar feed available at /calendar`);
});
