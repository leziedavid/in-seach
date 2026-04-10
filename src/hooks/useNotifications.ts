import { useEffect, useState, useCallback } from 'react';
import { subscribePush, unsubscribePush } from '@/api/api';
import { getUserId } from '@/lib/auth';

const VAPID_PUBLIC_KEY = 'BGKUqRQ2ZOlg2TlsWu9t8L2Od0vhLohkLi1kZoj8A0c48G-ZKKCGZNPoBEQocPCZo-8BNX6w9TQpMah3ds4Eun8';

export const useNotifications = () => {
  const userId = getUserId();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialisation : Vérifier la permission et l'abonnement existant
  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
        setPermission(Notification.permission);
        
        try {
          const registration = await navigator.serviceWorker.ready;
          const sub = await registration.pushManager.getSubscription();
          setSubscription(sub);
        } catch (error) {
          console.error('Error checking push subscription:', error);
        }
      }
      setLoading(false);
    };

    checkStatus();
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    }
    throw new Error('Service Worker not supported');
  };

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'default';
  };

  const subscribe = async () => {
    if (!userId) {
        console.error("User not authenticated");
        return;
    }
    setLoading(true);
    try {
      const registration = await registerServiceWorker();
      
      // Demander la permission explicitement
      const result = await requestPermission();
      
      if (result !== 'granted') {
          throw new Error('Permission not granted for notifications');
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subJSON = pushSubscription.toJSON();
      await subscribePush(userId, {
        endpoint: subJSON.endpoint,
        keys: {
          p256dh: subJSON.keys?.p256dh,
          auth: subJSON.keys?.auth
        }
      });

      setSubscription(pushSubscription);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      let currentSub = subscription;
      
      // Si l'état local est vide, on essaie de le récupérer depuis le navigateur
      if (!currentSub && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        currentSub = await registration.pushManager.getSubscription();
      }

      if (currentSub) {
        await currentSub.unsubscribe();
        await unsubscribePush(currentSub.endpoint);
        setSubscription(null);
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    subscription,
    loading,
    subscribe,
    unsubscribe,
    requestPermission,
    isNotificationsEnabled: !!subscription && permission === 'granted'
  };
};


