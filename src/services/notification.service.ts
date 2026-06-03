import { getToken, onMessage, Messaging } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { subscribePush } from "@/api/api";

const VAPID_KEY1 = "BGKUqRQ2ZOlg2TlsWu9t8L2Od0vhLohkLi1kZoj8A0c48G-ZKKCGZNPoBEQocPCZo-8BNX6w9TQpMah3ds4Eun8"; // Existing VAPID key in context, verify if FCM needs its own or this one
const VAPID_KEY = "BPDlcMpaFaR-5qJv_qOOX7uTvM2vyGHkAGyWURkfA5wLvF2RcLxC0wU-XhdCMALeZ40xSNUyT5Ujcjex3EnXqPM"


export const notificationService = {
  /**
   * Request user permission for notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return await Notification.requestPermission();
  },

  /**
   * Get FCM Token and subscribe user in backend
   */
  async subscribeUser(userId: string): Promise<string | null> {
    if (!messaging) return null;

    try {
      let permission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
      if (permission === "default") {
        permission = await this.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error("Permission NOT granted for notifications");
      }

      // Attendre que le Service Worker soit prêt pour éviter les race conditions sur iOS/Chrome
      let registration: ServiceWorkerRegistration | undefined;
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        registration = await navigator.serviceWorker.ready;
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log("FCM Token acquired:", token);
        // Sync with backend
        await subscribePush(userId, { type: 'fcm', token: token, device: typeof window !== 'undefined' ? window.navigator.userAgent : 'web' });
        return token;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
        return null;
      }
    } catch (error) {
      console.error("Error subscribing user to FCM:", error);
      return null;
    }
  },

  /**
   * Listen for incoming messages in foreground
   */
  onForegroundMessage(callback: (payload: any) => void) {
    if (!messaging) return () => { };
    return onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      callback(payload);
    });
  }
};
