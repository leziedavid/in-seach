import { useEffect, useState, useCallback } from 'react';
import { getUserId } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';
import { useNotification as useToast } from '@/components/toast/NotificationProvider';
import { getPushSubscriptions, unsubscribePush } from '@/api/api';

export const useNotifications = () => {
  const userId = getUserId();
  const { addNotification } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  // Initialisation : Vérifier la permission et l'état côté backend
  useEffect(() => {

    const checkStatus = async () => {
      if (typeof window === 'undefined') return;

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      if (userId) {
        try {
          // Vérifier si une subscription active existe sur le backend
          const res = await getPushSubscriptions(userId);
          if (res.statusCode === 200 && res.data && res.data.length > 0) {
            const activeSub = res.data.find(sub => sub.isActive);
            setIsNotificationsEnabled(!!activeSub);
            if (activeSub) setToken(activeSub.endpoint);
          }
        } catch (error) {
          console.error('Error checking notification status:', error);
        }
      }
      setLoading(false);
    };

    checkStatus();
  }, [userId]);

  // Listen for foreground messages logic moved to WebPushManager for better UI/UX


  const requestPermission = async () => {

    const result = await notificationService.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = async () => {

    if (!userId) {
      console.error("User not authenticated");
      return false;
    }

    setLoading(true);

    try {
      const fcmToken = await notificationService.subscribeUser(userId);
      if (fcmToken) {
        setToken(fcmToken);
        setIsNotificationsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to subscribe to FCM', error);
      return false;
    } finally {
      setLoading(false);
    }

  };

  const unsubscribe = async () => {

    if (!userId || !token) return false;
    setLoading(true);

    try {
      // Désactiver la subscription sur le backend
      const res = await unsubscribePush(token);

      if (res.statusCode === 200 || res.statusCode === 201) {
        setToken(null);
        setIsNotificationsEnabled(false);
        return true;
      }
      return false;

    } catch (error) {

      console.error('Failed to unsubscribe', error);
      return false;

    } finally {
      setLoading(false);
    }

  };

  return { permission, token, loading, subscribe, unsubscribe, requestPermission, isNotificationsEnabled };

};



