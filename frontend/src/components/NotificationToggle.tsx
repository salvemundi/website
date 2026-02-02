'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed
} from '@/shared/lib/services/push-notification-service';

interface NotificationToggleProps {
  userId?: string;
  className?: string;
}

export default function NotificationToggle({ userId, className = '' }: NotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getNotificationPermission());
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);
    }
  };

  const handleToggle = async () => {
    if (!isSupported) {
      alert('Push notificaties worden niet ondersteund door je browser.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          alert('Je bent uitgeschreven van push notificaties.');
        }
      } else {
        // Subscribe
        const subscription = await subscribeToPushNotifications(userId);
        if (subscription) {
          setIsSubscribed(true);
          setPermission('granted');
          alert('Je ontvangt nu push notificaties!');
        } else {
          alert('Notificaties zijn geweigerd. Sta notificaties toe in je browser instellingen.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isSubscribed
          ? 'bg-purple-600 text-white hover:bg-purple-700'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isSubscribed ? (
        <>
          <Bell className="h-5 w-5" />
          Notificaties aan
        </>
      ) : (
        <>
          <BellOff className="h-5 w-5" />
          Notificaties uit
        </>
      )}
    </button>
  );
}
