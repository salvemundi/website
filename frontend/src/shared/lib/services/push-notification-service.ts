/**
 * Push Notification Service
 * Handles push notification subscriptions and permissions
 */

// Determine the notification API URL
// In production, try common patterns if env var is not set
function getNotificationApiUrl(): string {
  // If explicitly set, use that
  if (process.env.NEXT_PUBLIC_NOTIFICATION_API_URL) {
    return process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
  }
  
  return 'https://notifications.salvemundi.nl';
}

const NOTIFICATION_API_URL = getNotificationApiUrl();

// Log the notification API URL for debugging
if (typeof window !== 'undefined') {
  console.log('[Push] Notification API URL:', NOTIFICATION_API_URL);
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window;
}

// Check if service worker is registered
async function isServiceWorkerRegistered(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined;
  } catch (error) {
    console.error('Error checking service worker registration:', error);
    return false;
  }
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Get VAPID public key from notification API
async function getVapidPublicKey(): Promise<string> {
  try {
    console.log(`[Push] Fetching VAPID key from: ${NOTIFICATION_API_URL}/vapid-public-key`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${NOTIFICATION_API_URL}/vapid-public-key`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('[Push] VAPID key fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to get VAPID public key: ${response.status}`);
    }
    const data = await response.json();
    console.log('[Push] VAPID key fetched successfully');
    return data.publicKey;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Push] VAPID key fetch timed out after 5 seconds');
      throw new Error('Notification API timeout - could not fetch VAPID key');
    }
    console.error('Error getting VAPID public key:', error);
    throw error;
  }
}

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId?: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  // Check if service worker is registered
  const swRegistered = await isServiceWorkerRegistered();
  if (!swRegistered) {
    console.error('[Push] Service worker is not registered. Attempting to register...');
    
    // Try to register the service worker now
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Push] Service worker registered successfully:', registration.scope);
      
      // Wait a bit for it to activate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('[Push] Failed to register service worker:', error);
      throw new Error('Service worker registration failed. Please reload the page and try again.');
    }
  }

  // Request permission first
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  try {
    // Get service worker registration with timeout
    console.log('[Push] Waiting for service worker to be ready...');
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout - waited 10 seconds. Please reload the page.')), 10000)
      )
    ]);
    console.log('[Push] Service worker is ready');

    // Get VAPID public key
    console.log('[Push] Fetching VAPID public key...');
    const vapidPublicKey = await getVapidPublicKey();
    console.log('[Push] VAPID key received');
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push notifications
    console.log('[Push] Subscribing to push manager...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource
    });
    console.log('[Push] Push manager subscription created');

    // Send subscription to backend
    console.log('[Push] Sending subscription to backend...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${NOTIFICATION_API_URL}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Push] Backend error:', response.status, errorText);
      throw new Error(`Failed to save subscription: ${response.status}`);
    }

    console.log('✓ Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 10000)
      )
    ]);
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`${NOTIFICATION_API_URL}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('✓ Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Check if user is currently subscribed
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 5000)
      )
    ]);
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

// Get current subscription
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 5000)
      )
    ]);
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting current subscription:', error);
    return null;
  }
}
