/**
 * Notification API
 * Handles push notifications for PWA
 */
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://salvemundi.nl',
  'https://www.salvemundi.nl',
  'https://dev.salvemundi.nl',
  'https://preprod.salvemundi.nl'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.CORS_ALLOW_ALL === 'true') return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.error('⚠️  VAPID keys not configured! Generate keys with: npx web-push generate-vapid-keys');
  console.error('⚠️  Public key present:', !!vapidKeys.publicKey);
  console.error('⚠️  Private key present:', !!vapidKeys.privateKey);
} else {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'info@salvemundi.nl'),
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('✓ Web-push configured with VAPID keys');
  console.log('✓ VAPID subject:', 'mailto:' + (process.env.VAPID_EMAIL || 'info@salvemundi.nl'));
  console.log('✓ Public key (first 20 chars):', vapidKeys.publicKey.substring(0, 20) + '...');
}

// Directus configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.salvemundi.nl';
const DIRECTUS_NOTIFICATION_KEY = process.env.DIRECTUS_NOTIFICATION_KEY;

console.log('🔍 Environment variables check:');
console.log('   DIRECTUS_URL:', DIRECTUS_URL);
console.log('   DIRECTUS_NOTIFICATION_KEY present:', !!DIRECTUS_NOTIFICATION_KEY);
console.log('   DIRECTUS_NOTIFICATION_KEY type:', typeof DIRECTUS_NOTIFICATION_KEY);
console.log('   DIRECTUS_NOTIFICATION_KEY length:', DIRECTUS_NOTIFICATION_KEY ? DIRECTUS_NOTIFICATION_KEY.length : 0);
console.log('   DIRECTUS_NOTIFICATION_KEY value is empty string:', DIRECTUS_NOTIFICATION_KEY === '');
console.log('   DIRECTUS_NOTIFICATION_KEY value is undefined:', DIRECTUS_NOTIFICATION_KEY === undefined);
console.log('   DIRECTUS_NOTIFICATION_KEY raw value:', JSON.stringify(DIRECTUS_NOTIFICATION_KEY));
console.log('   All env keys containing DIRECTUS:', Object.keys(process.env).filter(k => k.includes('DIRECTUS')));

if (!DIRECTUS_NOTIFICATION_KEY || DIRECTUS_NOTIFICATION_KEY.trim() === '') {
  console.error('⚠️  DIRECTUS_NOTIFICATION_KEY not configured or empty!');
  console.error('⚠️  Raw value:', JSON.stringify(process.env.DIRECTUS_NOTIFICATION_KEY));
} else {
  const keyPreview = DIRECTUS_NOTIFICATION_KEY.length > 4 
    ? '...' + DIRECTUS_NOTIFICATION_KEY.slice(-4)
    : '***';
  console.log('✓ Directus notification key configured');
  console.log('✓ Using key ending with:', keyPreview);
}

// Helper to fetch from Directus
async function directusFetch(endpoint, options = {}) {
  try {
    const url = `${DIRECTUS_URL}${endpoint}`;
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_NOTIFICATION_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      data: options.body,
      ...options
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Directus fetch error:', error.response?.data || error.message);
    throw error;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    vapidConfigured: !!(vapidKeys.publicKey && vapidKeys.privateKey)
  });
});

// Get VAPID public key
app.get('/vapid-public-key', (req, res) => {
  if (!vapidKeys.publicKey) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription in Directus
    // Note: If 'keys' field is JSON type in Directus, store as object
    // If it's TEXT/String type, store as JSON string
    const subscriptionData = {
      user_id: userId || null,
      endpoint: subscription.endpoint,
      keys: subscription.keys, // Store as object, Directus will handle JSON serialization
      user_agent: req.headers['user-agent'],
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString()
    };

    // Check if subscription already exists
    const existingSubscriptions = await directusFetch(
      `/items/push_notification?filter[endpoint][_eq]=${encodeURIComponent(subscription.endpoint)}`
    );

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Update existing subscription
      await directusFetch(`/items/push_notification/${existingSubscriptions[0].id}`, {
        method: 'PATCH',
        body: subscriptionData
      });
      console.log('✓ Push subscription updated');
    } else {
      // Create new subscription
      await directusFetch('/items/push_notification', {
        method: 'POST',
        body: subscriptionData
      });
      console.log('✓ Push subscription created');
    }

    res.status(201).json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Unsubscribe from push notifications
app.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    // Find and delete subscription from Directus
    const subscriptions = await directusFetch(
      `/items/push_notification?filter[endpoint][_eq]=${encodeURIComponent(endpoint)}`
    );

    if (subscriptions && subscriptions.length > 0) {
      await directusFetch(`/items/push_notification/${subscriptions[0].id}`, {
        method: 'DELETE'
      });
      console.log('✓ Push subscription deleted');
    }

    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Send notification to specific user(s)
app.post('/send', async (req, res) => {
  try {
    const { userIds, title, body, data, icon, badge, tag } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    let subscriptions;
    
    if (userIds && userIds.length > 0) {
      // Send to specific users
      const userFilter = userIds.map(id => `filter[user_id][_eq]=${id}`).join('&');
      subscriptions = await directusFetch(`/items/push_notification?${userFilter}`);
    } else {
      // Send to all subscribed users
      subscriptions = await directusFetch('/items/push_notification?limit=-1');
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-512x512.png',
      badge: badge || '/icon-192x192.png',
      tag: tag || 'salve-mundi-notification',
      data: {
        url: data?.url || '/',
        ...data
      }
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Handle keys: if it's already an object (JSON field in Directus), use it
          // If it's a string, parse it
          const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
          
          const subscription = {
            endpoint: sub.endpoint,
            keys: keys
          };

          await webpush.sendNotification(subscription, payload);
          
          // Update last_used timestamp
          await directusFetch(`/items/push_notification/${sub.id}`, {
            method: 'PATCH',
            body: { last_used: new Date().toISOString() }
          });

          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          // Log detailed error information
          console.error('❌ Failed to send notification:', {
            endpoint: sub.endpoint,
            error: error.message,
            statusCode: error.statusCode,
            body: error.body,
            headers: error.headers
          });
          
          // If subscription is invalid, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await directusFetch(`/items/push_notification/${sub.id}`, {
              method: 'DELETE'
            });
            console.log('Deleted invalid subscription:', sub.endpoint);
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✓ Sent ${successful} notifications, ${failed} failed`);

    res.json({
      success: true,
      sent: successful,
      failed: failed,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Send notification about new event
app.post('/notify-new-event', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    // Fetch event details from Directus
    const event = await directusFetch(`/items/events/${eventId}`);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all subscriptions
    const subscriptions = await directusFetch('/items/push_notification?limit=-1');

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title: '🎉 Nieuwe Activiteit!',
      body: `${event.name} - Schrijf je nu in!`,
      icon: '/icon-512x512.png',
      badge: '/icon-192x192.png',
      tag: `event-${eventId}`,
      data: {
        url: `/activiteit/${eventId}`,
        eventId: eventId,
        type: 'new-event'
      }
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
          const subscription = {
            endpoint: sub.endpoint,
            keys: keys
          };
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await directusFetch(`/items/push_notification/${sub.id}`, {
              method: 'DELETE'
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`✓ Sent ${successful} new event notifications`);

    res.json({ success: true, sent: successful });
  } catch (error) {
    console.error('Notify new event error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Send reminder notification for event
app.post('/notify-event-reminder', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    // Fetch event details
    const event = await directusFetch(`/items/events/${eventId}`);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get users who signed up for this event
    const signups = await directusFetch(
      `/items/event_signups?filter[event_id][_eq]=${eventId}&fields=directus_relations`
    );

    if (!signups || signups.length === 0) {
      return res.status(404).json({ error: 'No signups found for this event' });
    }

    const userIds = signups.map(signup => signup.directus_relations).filter(Boolean);

    if (userIds.length === 0) {
      return res.status(404).json({ error: 'No valid user IDs found in signups' });
    }

    // Get subscriptions for these users using _in operator
    const userIdsParam = userIds.join(',');
    const subscriptions = await directusFetch(`/items/push_notification?filter[user_id][_in]=${userIdsParam}`);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found for signed up users' });
    }

    const payload = JSON.stringify({
      title: '⏰ Herinnering!',
      body: `Je kunt je nog steeds aanmelden voor: ${event.name}`,
      icon: '/icon-512x512.png',
      badge: '/icon-192x192.png',
      tag: `event-reminder-${eventId}`,
      data: {
        url: `/activiteiten/${eventId}`,
        eventId: eventId,
        type: 'event-reminder'
      }
    });

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
          const subscription = {
            endpoint: sub.endpoint,
            keys: keys
          };
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await directusFetch(`/items/push_notification/${sub.id}`, {
              method: 'DELETE'
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`✓ Sent ${successful} event reminder notifications`);

    res.json({ success: true, sent: successful });
  } catch (error) {
    console.error('Notify event reminder error:', error);
    res.status(500).json({ error: 'Failed to send reminder notifications' });
  }
});

// Send notification about new intro blog
app.post('/notify-new-intro-blog', async (req, res) => {
  try {
    const { blogId, blogTitle } = req.body;

    console.log('[Intro Blog] Received request:', { blogId, blogTitle });

    if (!blogId || !blogTitle) {
      console.log('[Intro Blog] Missing blogId or blogTitle');
      return res.status(400).json({ error: 'Blog ID and title required' });
    }

    // Get all subscriptions
    console.log('[Intro Blog] Fetching all subscriptions...');
    const subscriptions = await directusFetch('/items/push_notification?limit=-1');
    console.log('[Intro Blog] Found subscriptions:', subscriptions?.length || 0);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Intro Blog] No subscriptions found');
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    console.log('[Intro Blog] Preparing to send notifications...');
    const payload = JSON.stringify({
      title: '📰 Nieuwe Intro Blog!',
      body: `${blogTitle} - Lees het laatste nieuws!`,
      icon: '/icon-512x512.png',
      badge: '/icon-192x192.png',
      tag: `intro-blog-${blogId}`,
      data: {
        url: `/intro/blog`,
        blogId: blogId,
        type: 'new-intro-blog'
      }
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
          const subscription = {
            endpoint: sub.endpoint,
            keys: keys
          };
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (error) {
          console.error('[Intro Blog] Error sending to endpoint:', sub.endpoint, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await directusFetch(`/items/push_notification/${sub.id}`, {
              method: 'DELETE'
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✓ Sent ${successful} new intro blog notifications (${failed} failed)`);

    res.json({ success: true, sent: successful, failed: failed });
  } catch (error) {
    console.error('Notify new intro blog error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send notifications', details: error.message });
  }
});

// Send custom notification to intro signups
app.post('/notify-intro-signups', async (req, res) => {
  try {
    const { title, body, includeParents } = req.body;

    console.log('[Intro Signups] Received request:', { title, body, includeParents });

    if (!title || !body) {
      console.log('[Intro Signups] Missing title or body');
      return res.status(400).json({ error: 'Title and body are required' });
    }

    let userIds = [];
    
    // Only fetch parent signups which have user_id (intro signups are anonymous)
    if (includeParents) {
      console.log('[Intro Signups] Fetching parent signups...');
      const parentSignups = await directusFetch('/items/intro_parent_signups?limit=-1&fields=user_id');
      console.log('[Intro Signups] Found parent signups:', parentSignups?.length || 0);
      if (parentSignups && parentSignups.length > 0) {
        userIds = parentSignups.map(p => p.user_id).filter(Boolean);
        console.log('[Intro Signups] Filtered user IDs:', userIds.length);
      }
    }

    // Get subscriptions for intro ouders only
    let subscriptions;
    if (userIds.length > 0) {
      console.log('[Intro Signups] Fetching subscriptions for intro ouders:', userIds.length);
      const userIdsParam = userIds.join(',');
      subscriptions = await directusFetch(`/items/push_notification?filter[user_id][_in]=${userIdsParam}`);
    } else {
      console.log('[Intro Signups] includeParents is false or no parent signups found');
      return res.status(400).json({ 
        error: 'No recipients available. Enable "includeParents" to send to intro ouders with accounts.',
        sent: 0
      });
    }

    console.log('[Intro Signups] Found subscriptions:', subscriptions?.length || 0);

    console.log('[Intro Signups] Found subscriptions:', subscriptions?.length || 0);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Intro Signups] No subscriptions found, returning 404');
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    console.log('[Intro Signups] Preparing to send notifications...');
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-512x512.png',
      badge: '/icon-192x192.png',
      tag: 'intro-custom-notification',
      data: {
        url: '/intro',
        type: 'intro-custom'
      }
    });

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
          const subscription = {
            endpoint: sub.endpoint,
            keys: keys
          };
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (error) {
          console.error('[Intro Signups] Error sending to endpoint:', sub.endpoint, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await directusFetch(`/items/push_notification/${sub.id}`, {
              method: 'DELETE'
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✓ Sent ${successful} intro custom notifications (${failed} failed)`);

    res.json({ success: true, sent: successful, failed: failed });
  } catch (error) {
    console.error('Notify intro signups error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send notifications', details: error.message });
  }
});

// Send membership renewal reminder notification
app.post('/notify-membership-renewal-reminder', async (req, res) => {
  try {
    const { daysBeforeExpiry = 30 } = req.body;

    console.log(`[Membership Renewal] Fetching members expiring within ${daysBeforeExpiry} days...`);

    // Calculate date range
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysBeforeExpiry);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    console.log(`[Membership Renewal] Date range: ${todayStr} to ${futureDateStr}`);

    // Fetch all users with membership expiry dates within the range
    const users = await directusFetch(
      `/users?filter[membership_expiry][_gte]=${todayStr}&filter[membership_expiry][_lte]=${futureDateStr}&fields=id,first_name,last_name,email,membership_expiry&limit=-1`
    );

    if (!users || users.length === 0) {
      console.log('[Membership Renewal] No members found expiring in the specified period');
      return res.json({ success: true, sent: 0, message: 'No members found expiring soon' });
    }

    console.log(`[Membership Renewal] Found ${users.length} members expiring soon`);

    // Get subscriptions for these users
    const userIds = users.map(u => u.id).filter(Boolean);
    if (userIds.length === 0) {
      return res.status(404).json({ error: 'No valid user IDs found' });
    }

    const userIdsParam = userIds.join(',');
    const subscriptions = await directusFetch(`/items/push_notification?filter[user_id][_in]=${userIdsParam}`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Membership Renewal] No push subscriptions found for expiring members');
      return res.json({ success: true, sent: 0, message: 'No push subscriptions found' });
    }

    console.log(`[Membership Renewal] Found ${subscriptions.length} subscriptions`);

    // Create a map of user IDs to expiry dates for personalized messages
    const userExpiryMap = new Map();
    users.forEach(user => {
      if (user.id && user.membership_expiry) {
        userExpiryMap.set(user.id, user.membership_expiry);
      }
    });

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const expiryDate = userExpiryMap.get(sub.user_id);
          const daysUntilExpiry = expiryDate 
            ? Math.ceil((new Date(expiryDate) - today) / (1000 * 60 * 60 * 24))
            : daysBeforeExpiry;

          const payload = JSON.stringify({
            title: '⚠️ Lidmaatschap verloopt binnenkort!',
            body: daysUntilExpiry <= 7 
              ? `Je lidmaatschap verloopt over ${daysUntilExpiry} dag${daysUntilExpiry !== 1 ? 'en' : ''}. Verlengen kan via de app!`
              : `Je lidmaatschap verloopt over ongeveer ${Math.floor(daysUntilExpiry / 7)} ${Math.floor(daysUntilExpiry / 7) === 1 ? 'week' : 'weken'}. Vergeet niet te verlengen!`,
            icon: '/icon-512x512.png',
            badge: '/icon-192x192.png',
            tag: 'membership-renewal',
            data: {
              url: '/lid-worden',
              type: 'membership-renewal',
              daysUntilExpiry: daysUntilExpiry
            }
          });

          const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
          const subscription = {
            endpoint: sub.endpoint,
            keys: keys
          };
          await webpush.sendNotification(subscription, payload);
          console.log(`[Membership Renewal] Sent notification to user ${sub.user_id}`);
          return { success: true };
        } catch (error) {
          console.error('[Membership Renewal] Error sending to endpoint:', sub.endpoint, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await directusFetch(`/items/push_notification/${sub.id}`, {
              method: 'DELETE'
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✓ Sent ${successful} membership renewal reminders (${failed} failed)`);

    res.json({ success: true, sent: successful, failed: failed });
  } catch (error) {
    console.error('Notify membership renewal error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send membership renewal notifications', details: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Notification API running on port ${PORT}`);
  console.log(`   VAPID configured: ${!!(vapidKeys.publicKey && vapidKeys.privateKey)}`);
});
