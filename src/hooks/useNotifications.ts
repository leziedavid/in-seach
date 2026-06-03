import { useEffect, useState, useCallback } from 'react';
import { getUserId } from '@/lib/auth';
import { notificationService } from '@/services/notification.service';
import { useNotification as useToast } from '@/components/notifications/NotificationProvider';
import { getPushSubscriptions, unsubscribePush } from '@/api/api';

export const useNotifications = () => {
  const userId = getUserId();
  const { addNotification } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [hasRefused, setHasRefused] = useState(false);

  // Détecter si le Push est supporté sur cet appareil/navigateur
  const checkPushSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Sur iOS, le push n'est possible qu'en mode standalone (PWA installé sur l'écran d'accueil)
    if (isIOS && !isStandalone) {
      return false;
    }
    
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }, []);

  const isPushSupported = checkPushSupport();

  // Charger le statut de refus persistant spécifique à l'utilisateur actuel
  useEffect(() => {
    if (userId) {
      const refused = localStorage.getItem(`notificationRefused_${userId}`) === 'true';
      setHasRefused(refused);
    } else {
      setHasRefused(false);
    }
  }, [userId]);

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

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = async () => {
    if (!userId) {
      console.error("User not authenticated");
      return false;
    }

    if (!isPushSupported) {
      console.warn("Push notifications not supported on this device/browser (iOS Safari must be standalone)");
      return false;
    }

    // ÉTAPE CRITIQUE : Demande de permission IMMÉDIATE pour préserver le contexte du geste utilisateur
    let currentPermission = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
    if (currentPermission === 'default') {
      try {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      } catch (err) {
        console.error("Failed to request permission synchronously:", err);
      }
    }

    if (currentPermission !== 'granted') {
      console.warn("Permission not granted:", currentPermission);
      return false;
    }

    setLoading(true);

    try {
      const fcmToken = await notificationService.subscribeUser(userId);
      if (fcmToken) {
        setToken(fcmToken);
        setIsNotificationsEnabled(true);
        // Nettoyer le refus en cas de succès
        localStorage.removeItem(`notificationRefused_${userId}`);
        setHasRefused(false);
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

  const dismissModal = () => {
    if (userId) {
      localStorage.setItem(`notificationRefused_${userId}`, 'true');
      setHasRefused(true);
    }
  };

  const resetRefusal = () => {
    if (userId) {
      localStorage.removeItem(`notificationRefused_${userId}`);
      setHasRefused(false);
    }
  };

  const showModal = !!userId && permission === 'default' && !hasRefused;

  return {
    permission,
    token,
    loading,
    subscribe,
    unsubscribe,
    requestPermission,
    isNotificationsEnabled,
    isPushSupported,
    showModal,
    dismissModal,
    resetRefusal,
    userId
  };
};



