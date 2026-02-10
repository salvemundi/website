/**
 * Email API
 * Environment Isolation Audit: 2025-12-31 (Permission Fix Re-run)
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the first proxy (e.g. Nginx, Cloudflare) to get the real client IP
// for express-rate-limit and req.ip
app.set('trust proxy', 1);

// Middleware
// Configure CORS with a flexible origin check. In production, prefer
// explicitly listing allowed origins. For quick debugging set
// CORS_ALLOW_ALL=true in the env to allow requests from any origin.
const allowedOrigins = [
  'http://localhost:5173',
  'https://salvemundi.nl',
  'https://www.salvemundi.nl',
  'https://dev.salvemundi.nl',
  'https://preprod.salvemundi.nl'
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
// Capture raw body so we can attempt to sanitize malformed JSON (e.g. smart quotes)
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString();
    } catch (e) {
      req.rawBody = '';
    }
  }
}));

// Error handler to attempt to recover from JSON parse errors caused by
// non-ASCII smart quotes or similar punctuation. If parsing fails we try
// to replace common smart quotes with ASCII equivalents and re-parse.
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed') && req && typeof req.rawBody === 'string') {
    try {
      const sanitized = req.rawBody
        .replace(/[\u2018\u2019]/g, "'") // ‘ ’ => '
        .replace(/[\u201C\u201D]/g, '"'); // “ ” => "

      req.body = JSON.parse(sanitized);
      // proceed to the next middleware/route with req.body populated
      return next();
    } catch (parseErr) {
      console.error('Failed to parse sanitized JSON body:', parseErr);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  }

  // Not a JSON parse error we can handle — forward to the default handler
  return next(err);
});

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

// Helper: ensure HTML email content includes color-scheme meta and
// a small CSS block with `prefers-color-scheme` so emails adapt to
// light/dark where supported. If the provided HTML already contains
// a <head> we inject the meta/styles there; otherwise we wrap the
// content in a basic HTML scaffold.
function ensureAdaptiveEmailHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return rawHtml;

  const hasHead = /<head[\s>]/i.test(rawHtml);
  const hasColorMeta = /name=("|')?color-scheme|supported-color-schemes/i.test(rawHtml);
  const adaptiveHead = `\n    <meta name="color-scheme" content="light dark">\n    <meta name="supported-color-schemes" content="light dark">\n    <style>\n      :root{--bg:#ffffff;--card:#ffffff;--text:#000000;--muted:#6b7280;--accent1:#7B2CBF;--accent2:#FF6B35;--btn-text:#ffffff} \n      @media (prefers-color-scheme: dark){ :root{--bg:#071025;--card:#071229;--text:#e6eef8;--muted:#94a3b8} }\n      /* Fallbacks for clients that don't support variables */\n      body{background:var(--bg);color:var(--text)}\n      .card{background:var(--card)}\n    </style>\n  `;

  if (hasHead) {
    if (hasColorMeta) return rawHtml;
    // inject before </head>
    return rawHtml.replace(/<\/head>/i, adaptiveHead + '\n</head>');
  }

  // No head — wrap the content. Add a bgcolor attribute for older clients.
  return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width,initial-scale=1" />\n  ${adaptiveHead}\n</head>\n<body bgcolor="#f9fafb" style="margin:0;padding:0;background:var(--bg);color:var(--text);">\n  ${rawHtml}\n</body>\n</html>`;
}

// Append a simple contact footer to HTML email bodies if not already present
function appendContactFooterToHtml(html) {
  if (!html || typeof html !== 'string') return html;
  const footerHtml = `\n<div style="margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:13px;color:#666;">\n  <p style="margin:0 0 6px 0;"><strong>Algemene info, mail naar:</strong> <a href=\"mailto:info@salvemundi.nl\" style=\"color:#7B2CBF;text-decoration:none;\">info@salvemundi.nl</a></p>\n  <p style=\"margin:0;font-size:12px;color:#999;\">Bezoek https://salvemundi.nl voor meer informatie</p>\n</div>\n`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, footerHtml + '\n</body>');
  }

  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, footerHtml + '\n</html>');
  }

  return html + footerHtml;
}

const rateLimit = require('express-rate-limit');

// Rate limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for internal services that provide a valid API key
    const apiKey = req.headers['x-api-key'] || req.headers['x-internal-api-secret'];
    return apiKey && apiKey === process.env.INTERNAL_API_KEY;
  },
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all requests
app.use(limiter);

// API Key Middleware
// Only allow requests with a valid x-api-key header
// Except for /health, /calendar and debug endpoints which might be public or dev-only
const apiKeyAuth = (req, res, next) => {
  // Skip auth for health check, calendar, and common browser/debug paths
  const publicPaths = [
    '/health',
    '/calendar',
    '/calendar.ics',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/debug-headers',
    '/calendar/debug'
  ];

  if (publicPaths.includes(req.path) || req.path.startsWith('/.well-known')) {
    return next();
  }

  // Skip auth for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Check for API key - support both standard and internal header names
  const apiKey = req.headers['x-api-key'] || req.headers['x-internal-api-secret'];
  const validApiKey = process.env.INTERNAL_API_KEY;

  if (!validApiKey) {
    // If no key is configured on server, warn but allow (or deny? Safe default: deny)
    console.error('❌ [email-api] INTERNAL_API_KEY is not set in environment variables! Denying all requests.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!apiKey || apiKey !== validApiKey) {
    // Special handling for misrouted paths to help debugging
    if (req.path.startsWith('/api/payments')) {
      console.warn(`🚨 [email-api] MISROUTING DETECTED: ${req.path} reached email-api instead of payment-api. Check proxy rules! (IP: ${req.ip})`);
    } else {
      // Only log warnings for routes that actually exist or seem like real API attempts
      // to avoid log spam from random scans or misrouted standard requests (like /favicon.ico)
      const isNoise = ['/favicon.ico', '/robots.txt', '/apple-touch-icon.png'].includes(req.path);
      if (!isNoise) {
        console.warn(`⚠️ [email-api] Unauthorized access attempt from ${req.ip} to ${req.path}`);
      }
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

app.use(apiKeyAuth);

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    // Log some request metadata to help diagnose 404s coming from browsers
    console.log('📧 [email-api] Incoming /send-email request', {
      origin: req.headers.origin,
      host: req.headers.host,
      method: req.method,
      path: req.path,
      contentLength: req.headers['content-length'],
    });

    const { to, subject, html, from, fromName, attachments } = req.body || {};

    console.log('📧 [email-api] Email details:', {
      to,
      subject,
      from: from || 'using default',
      fromName: fromName || 'using default',
      hasHtml: !!html,
      htmlLength: html ? html.length : 0,
      attachmentsCount: attachments?.length || 0
    });

    // Validate required fields
    if (!to || !subject || !html) {
      console.error('❌ [email-api] Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    // Debug: log attachments summary received from proxy
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      console.log('📎 [email-api] Processing', attachments.length, 'attachment(s)');
      try {
        const summary = attachments.map(att => ({
          name: att.name,
          contentType: att.contentType,
          isInline: Boolean(att.isInline),
          contentId: att.contentId || null,
          bytesLength: att.contentBytes ? String(att.contentBytes).length : 0,
          firstChars: att.contentBytes ? String(att.contentBytes).substring(0, 30) : null
        }));
        console.log('📎 [email-api] Attachments summary:', JSON.stringify(summary, null, 2));
      } catch (e) {
        console.warn('⚠️ [email-api] Unable to summarize attachments:', e && e.message ? e.message : e);
      }
    } else {
      console.log('📎 [email-api] No attachments in request');
    }

    console.log('📧 [email-api] Preparing to send email to:', to);

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

    // Handle multiple recipients (comma-separated string or array)
    let recipientAddresses = [];
    if (typeof to === 'string') {
      // Split comma-separated string and trim whitespace
      recipientAddresses = to.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0);
    } else if (Array.isArray(to)) {
      recipientAddresses = to.filter(addr => addr && addr.trim().length > 0);
    } else {
      recipientAddresses = [to];
    }

    console.log('📧 [email-api] Recipient addresses:', recipientAddresses);

    const emailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: appendContactFooterToHtml(ensureAdaptiveEmailHtml(html)),
        },
        toRecipients: recipientAddresses.map(address => ({
          emailAddress: {
            address: address,
          },
        })),
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
      console.log('📎 [email-api] Building Microsoft Graph attachments...');
      emailPayload.message.attachments = attachments.map((attachment, index) => {
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
          console.log(`📎 [email-api] Attachment ${index + 1}: Inline with contentId="${attachment.contentId}"`);
        }

        return attachmentObj;
      });

      console.log('📎 [email-api] Prepared attachments for Graph API:', emailPayload.message.attachments.map(att => ({
        name: att.name,
        contentType: att.contentType,
        isInline: att.isInline,
        contentId: att.contentId,
        bytesLength: att.contentBytes ? att.contentBytes.length : 0,
      })));
    } else {
      console.log('📎 [email-api] No attachments to add to email payload');
    }

    console.log('📤 [email-api] Sending email via Microsoft Graph API...');
    console.log('📤 [email-api] Payload summary:', {
      to: emailPayload.message.toRecipients.map(r => r.emailAddress.address),
      subject: emailPayload.message.subject,
      hasBody: !!emailPayload.message.body,
      bodyLength: emailPayload.message.body?.content?.length || 0,
      attachmentsCount: emailPayload.message.attachments?.length || 0
    });

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
      console.error('❌ [email-api] Microsoft Graph API error:', {
        status: sendResponse.status,
        statusText: sendResponse.statusText,
        error: errorText
      });
      return res.status(sendResponse.status).json({
        error: 'Failed to send email via Microsoft Graph',
        details: errorText,
      });
    }

    console.log('✅ [email-api] Email sent successfully via Microsoft Graph API!');

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

// Lightweight debug endpoint to validate attachments locally without contacting Graph.
// Useful during development: POST the same payload you would to /send-email and
// the server will log attachment summaries and return success without performing any external calls.
app.post('/send-email-debug', async (req, res) => {
  try {
    console.log('🔧 /send-email-debug called - will echo attachments and return success');
    const { to, subject, html, from, fromName, attachments } = req.body || {};

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const summary = attachments.map(att => ({
        name: att.name,
        contentType: att.contentType,
        isInline: Boolean(att.isInline),
        contentId: att.contentId || null,
        bytesLength: att.contentBytes ? String(att.contentBytes).length : 0,
      }));
      console.log('📎 Attachments summary (debug):', summary);
    } else {
      console.log('📎 No attachments received (debug)');
    }

    // Echo back the payload so callers can inspect server-side parsing
    return res.json({ success: true, received: { to, subject, attachmentsCount: attachments ? attachments.length : 0 } });
  } catch (err) {
    console.error('Error in /send-email-debug:', err);
    return res.status(500).json({ error: 'Internal error in debug endpoint' });
  }
});

// Intro update notification endpoint
// Now expects the frontend to provide the subscriber emails
app.post('/send-intro-update', async (req, res) => {
  try {
    console.log('📧 Intro update notification requested');

    const { blogTitle, blogExcerpt, blogUrl, blogImage, subscribers } = req.body || {};

    if (!blogTitle || !blogUrl) {
      return res.status(400).json({
        error: 'Missing required fields: blogTitle, blogUrl'
      });
    }

    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No subscribers provided',
        sentCount: 0
      });
    }

    console.log(`📊 Processing ${subscribers.length} subscribers`);

    // Extract email addresses from subscribers array
    const emailsToSend = subscribers.map(sub => sub.email).filter(Boolean);

    if (emailsToSend.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No valid email addresses found',
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

    // Prepare inline image attachment if blogImage is provided
    let inlineAttachments = [];
    let imageCid = null;
    if (blogImage) {
      try {
        const urlToFetch = new URL(String(blogImage));
        const allowedHosts = ['salvemundi.nl', 'admin.salvemundi.nl', 'files.salvemundi.nl', 'localhost'];

        // Basic SSRF protection: only allow specific domains
        if (!allowedHosts.some(host => urlToFetch.hostname === host || urlToFetch.hostname.endsWith('.' + host))) {
          console.warn(`[Intro Update] Blocked SSRF attempt to: ${urlToFetch.hostname}`);
        } else if (urlToFetch.protocol !== 'https:' && urlToFetch.hostname !== 'localhost') {
          console.warn(`[Intro Update] Blocked non-https URL: ${urlToFetch.protocol}`);
        } else {
          const imgResp = await fetch(urlToFetch.toString());
          if (imgResp.ok) {
            const contentType = imgResp.headers.get('content-type') || 'application/octet-stream';
            const arrayBuffer = await imgResp.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            // Determine extension from content-type
            const extMatch = (contentType || '').match(/image\/(png|jpeg|jpg|webp|gif)/i);
            const ext = extMatch ? extMatch[1].replace('jpeg', 'jpg') : 'png';
            imageCid = `blogimg-${Date.now()}@salvemundi`;
            inlineAttachments.push({
              name: `blog-image.${ext}`,
              contentType,
              contentBytes: base64,
              isInline: true,
              contentId: imageCid,
            });
          } else {
            console.warn('Could not fetch blog image for inline attachment:', imgResp.status, imgResp.statusText);
          }
        }
      } catch (e) {
        console.warn('Error fetching blog image for inline attachment:', e && e.message ? e.message : e);
      }
    }

    const emailHtml = `
      <!doctype html>
      <html lang="nl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          :root{
            --bg: #f9fafb;
            --card: #ffffff;
            --text: #0f172a;
            --muted: #6b7280;
            --accent1: #7B2CBF;
            --accent2: #FF6B35;
            --btn-text: #ffffff;
          }
          @media (prefers-color-scheme: dark){
            :root{
              --bg: #071025;
              --card: #071229;
              --text: #e6eef8;
              --muted: #94a3b8;
            }
          }
          body{margin:0;padding:20px;background:var(--bg);font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;-webkit-font-smoothing:antialiased;color:var(--text);}
          .container{max-width:600px;margin:0 auto}
          .header{background: linear-gradient(135deg,var(--accent1) 0%, var(--accent2) 100%);padding:30px;text-align:center;border-radius:12px 12px 0 0}
          .header h1{color:var(--btn-text);margin:0;font-size:28px}
          .hero-image{width:100%;height:250px;overflow:hidden}
          .hero-image img{width:100%;height:100%;object-fit:cover;display:block;border:0}
          .card{background:var(--card);padding:30px;border-radius:0 0 12px 12px;color:var(--text)}
          .title{color:var(--accent1);margin-top:0}
          .excerpt{font-size:16px;color:var(--text);line-height:1.8}
          .cta{display:inline-block;background: linear-gradient(135deg,var(--accent1) 0%, var(--accent2) 100%);color:var(--btn-text);text-decoration:none;padding:14px 32px;border-radius:25px;font-weight:600}
          .footer{text-align:center;padding:20px;font-size:12px;color:var(--muted)}
          @media screen and (max-width:480px){.header{padding:20px}.card{padding:20px}.hero-image{height:180px}}
        </style>
      </head>
      <body bgcolor="#f9fafb" style="margin:0;padding:20px;background:var(--bg);font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;-webkit-font-smoothing:antialiased;color:var(--text);">
        <div class="container">
          <div class="header"><h1>Nieuwe Intro Update!</h1></div>

          ${imageCid ? `
            <div class="hero-image">
              <img src="cid:${imageCid}" alt="${blogTitle}" />
            </div>
          ` : (blogImage ? `
            <div class="hero-image">
              <img src="${blogImage}" alt="${blogTitle}" />
            </div>
          ` : '')}

          <div class="card">
            <h2 class="title">${blogTitle}</h2>

            ${blogExcerpt ? `
              <p class="excerpt">${blogExcerpt}</p>
            ` : ''}

            <div style="text-align:center;margin:30px 0;">
              <a href="${blogUrl}" class="cta">Lees meer →</a>
            </div>

            <p style="color:var(--muted);font-size:14px;margin-top:30px;">We hopen je snel te zien tijdens de introweek!<br><strong>Het Salve Mundi Intro Team</strong></p>
          </div>

          <div class="footer">
            <p>Je ontvangt deze email omdat je bent ingeschreven voor intro updates.<br>
            <a href="${blogUrl.replace('/blog', '')}" style="color:var(--accent1);text-decoration:none">Uitschrijven</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload = {
      message: {
        subject: `Intro Update: ${blogTitle}`,
        body: {
          contentType: 'HTML',
          content: appendContactFooterToHtml(emailHtml)
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

    // Attach inline image(s) if prepared
    if (inlineAttachments.length > 0) {
      emailPayload.message.attachments = inlineAttachments.map((attachment) => {
        const attachmentObj = {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachment.name,
          contentType: attachment.contentType,
          contentBytes: attachment.contentBytes,
          isInline: Boolean(attachment.isInline),
        };
        if (attachment.isInline && attachment.contentId) {
          attachmentObj.contentId = attachment.contentId;
        }
        return attachmentObj;
      });
    }

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

// Calendar feed endpoint (serve both /calendar and /calendar.ics)
app.get(['/calendar', '/calendar.ics'], async (req, res) => {
  try {
    console.log('📅 Calendar feed requested', { host: req.headers.host, url: req.url });

    // Helpful for debugging through proxies/CDNs
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Fetch events from Directus
    const directusUrl = process.env.DIRECTUS_URL || 'https://admin.salvemundi.nl';
    const directusToken = process.env.DIRECTUS_API_TOKEN;

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

    console.log('➡️ Fetching events from Directus', { url: `${directusUrl}/items/events`, status: eventsResponse.status });
    if (!eventsResponse.ok) {
      const errText = await eventsResponse.text();
      console.error('❌ Directus events fetch failed', { status: eventsResponse.status, body: errText });
      throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.data || [];
    console.log(`⬇️ Directus returned ${events.length} events`);

    // VTIMEZONE block for Europe/Amsterdam (basic, widely accepted)
    const tzBlock = [
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Amsterdam',
      'X-LIC-LOCATION:Europe/Amsterdam',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'END:STANDARD',
      'END:VTIMEZONE'
    ];

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
      ...tzBlock
    ];

    events.forEach(event => {
      const now = new Date();

      const escapeText = (text) => {
        if (!text) return '';
        return String(text).replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
      };

      // Helper: detect date-only strings like YYYY-MM-DD
      const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${event.id}@salvemundi.nl`);
      icsLines.push(`DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

      if (isDateOnly(event.event_date)) {
        // All-day event: use VALUE=DATE and DTEND as next day per RFC5545
        const [y, m, d] = String(event.event_date).split('-').map(Number);
        const dtStart = `${String(y).padStart(4, '0')}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;
        // compute next day
        const startObj = new Date(Date.UTC(y, m - 1, d));
        const nextDay = new Date(startObj.getTime() + 24 * 60 * 60 * 1000);
        const dtEnd = `${String(nextDay.getUTCFullYear()).padStart(4, '0')}${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}${String(nextDay.getUTCDate()).padStart(2, '0')}`;

        icsLines.push(`DTSTART;VALUE=DATE:${dtStart}`);
        icsLines.push(`DTEND;VALUE=DATE:${dtEnd}`);
      } else {
        // Date-time event: parse and emit UTC times (fallback)
        const startDate = new Date(event.event_date);
        const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
        const formatDateUTC = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        icsLines.push(`DTSTART:${formatDateUTC(startDate)}`);
        icsLines.push(`DTEND:${formatDateUTC(endDate)}`);
      }

      icsLines.push(`SUMMARY:${escapeText(event.name)}`);
      icsLines.push(`DESCRIPTION:${escapeText(event.description || '')}`);
      icsLines.push(`LOCATION:${escapeText(event.location || 'Salve Mundi')}`);
      // Prefer building a URL based on the requested host so proxied domains work
      const host = req.headers.host || 'salvemundi.nl';
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'https');
      icsLines.push(`URL:${protocol}://${host}/activiteiten?event=${event.id}`);
      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    // Set headers for calendar subscription — use inline disposition so clients treat it as a feed
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8; method=PUBLISH; component=VCALENDAR');
    res.setHeader('Content-Disposition', 'inline; filename="salve-mundi.ics"');
    res.setHeader('Content-Transfer-Encoding', '8bit');
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

// Convenience redirect for webcal scheme (clients sometimes map webcal to HTTP)
app.get('/.well-known/webcal', (req, res) => {
  const host = req.headers.host || 'salvemundi.nl';
  const redirectUrl = `https://${host}/calendar`;
  console.log('🔁 Redirecting /.well-known/webcal to', redirectUrl);
  res.redirect(301, redirectUrl);
});

// Debug endpoint to inspect events as returned from Directus (no ICS formatting)
app.get('/calendar/debug', async (req, res) => {
  try {
    const directusUrl = process.env.DIRECTUS_URL || 'https://admin.salvemundi.nl';
    const directusToken = process.env.DIRECTUS_API_TOKEN;
    if (!directusToken) return res.status(500).json({ error: 'Directus API key not configured' });

    const eventsResponse = await fetch(`${directusUrl}/items/events?fields=id,name,event_date,description,location&sort=-event_date&limit=-1`, {
      headers: { 'Authorization': `Bearer ${directusToken}` }
    });

    if (!eventsResponse.ok) {
      const errText = await eventsResponse.text();
      return res.status(eventsResponse.status).json({ error: 'Failed to fetch events from Directus', details: errText });
    }

    const eventsData = await eventsResponse.json();
    const events = (eventsData && eventsData.data) || [];

    // Return a compact representation to help debugging from a browser
    res.json({ count: events.length, sample: events.slice(0, 10).map(e => ({ id: e.id, name: e.name, event_date: e.event_date, location: e.location })) });
  } catch (err) {
    console.error('❌ /calendar/debug error', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email API server running on port ${PORT}`);
  console.log(`📧 Ready to send emails via Microsoft Graph`);
  console.log(`📅 Calendar feed available at /calendar`);
});
