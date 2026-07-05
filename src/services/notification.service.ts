import { getToken, onMessage, Messaging } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { subscribePush } from "@/api/api";

const VAPID_KEY = "BPDlcMpaFaR-5qJv_qOOX7uTvM2vyGHkAGyWURkfA5wLvF2RcLxC0wU-XhdCMALeZ40xSNUyT5Ujcjex3EnXqPM";


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
    if (!messaging) {
      // getMessaging() a échoué à l'initialisation (src/lib/firebase.ts) — navigateur non
      // supporté ou contexte non sécurisé. On lève pour que l'appelant affiche la vraie raison
      // au lieu du message générique précédent.
      throw new Error("Firebase Messaging indisponible sur ce navigateur/contexte (voir console pour le détail de l'initialisation).");
    }

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
      console.log("[notificationService] Waiting for service worker to be ready...");
      registration = await navigator.serviceWorker.ready;
      console.log("[notificationService] Service worker ready:", registration.scope);
    }

    console.log("[notificationService] Requesting FCM token...");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("[notificationService] getToken() returned no token.");
      return null;
    }

    console.log("[notificationService] FCM token acquired, syncing with backend...");
    await subscribePush(userId, { type: 'fcm', token: token, device: typeof window !== 'undefined' ? window.navigator.userAgent : 'web' });
    console.log("[notificationService] Subscription synced with backend.");
    return token;
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
