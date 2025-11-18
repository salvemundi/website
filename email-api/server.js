const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://salvemundi.nl',
    'https://preview.salvemundi.nl'
  ]
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, from, fromName } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log('📧 Sending email to:', to);

    // Step 1: Get access token from Microsoft
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MS_GRAPH_CLIENT_ID,
          client_secret: process.env.MS_GRAPH_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token error:', error);
      throw new Error(`Failed to get token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Got access token');

    // Step 2: Send email via Graph API
    const senderEmail = from || process.env.MS_GRAPH_SENDER_UPN || 'noreply@salvemundi.nl';
    const senderName = fromName || 'Salve Mundi';

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
      },
      saveToSentItems: false,
    };

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

app.listen(PORT, () => {
  console.log(`🚀 Email API server running on port ${PORT}`);
  console.log(`📧 Ready to send emails via Microsoft Graph`);
});
