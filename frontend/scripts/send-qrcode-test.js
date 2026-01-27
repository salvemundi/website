import QRCode from 'qrcode';
import fetch from 'node-fetch';
import fs from 'fs';

async function run() {
  const token = 'test-token-123';
  const dataUrl = await QRCode.toDataURL(token, { width: 250 });
  const base64 = dataUrl.split(',')[1];

  const payload = {
    to: 'devtest@example.com',
    from: 'noreply@salvemundi.nl',
    subject: 'QR Test',
    html: '<p>Test QR</p>',
    attachments: [
      {
        name: 'qr-test.png',
        contentType: 'image/png',
        contentBytes: base64,
        isInline: true,
        contentId: 'test-qrcode@salvemundi'
      }
    ]
  };

  // Prefer the debug endpoint on email-api if available
  const emailApi = process.env.EMAIL_API_ENDPOINT || 'http://localhost:3001/send-email-debug';
  console.log('Posting to', emailApi);

  const res = await fetch(emailApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  console.log('Response:', json);
}

run().catch(err => { console.error(err); process.exit(1); });
