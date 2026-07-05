// Version alignée sur le SDK npm "firebase" utilisé par l'app (package.json) — un écart de
// version (SW en v9.0.0 vs app en v12.x) est une cause connue de push silencieusement perdu sur
// Safari/iOS, dont l'implémentation standard du Web Push est plus stricte que celle de Chrome.
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDQnELn_IjnzPWrBlRKwB8jKJ6eQhY0vNE",
  authDomain: "djamko.firebaseapp.com",
  projectId: "djamko",
  storageBucket: "djamko.firebasestorage.app",
  messagingSenderId: "208510498449",
  appId: "1:208510498449:web:b21d9ff2e701a1bf163130",
  measurementId: "G-XRVH5Z853C"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// NOTE : skipWaiting()/clients.claim() ont été testés ici pour éviter le "il faut actualiser
// une fois après la première activation", mais forcer la prise de contrôle immédiate du SW
// peut interrompre en plein vol l'échange getToken() de Firebase Messaging avec les serveurs
// FCM (qui a besoin d'une ServiceWorkerRegistration stable pendant toute la négociation) —
// ça a cassé l'activation des notifications en test. Retiré : le léger inconvénient du refresh
// initial est préférable à un abonnement FCM qui casse silencieusement.

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/pwa/icon-192.png',
    badge: '/icons/pwa/icon-192.png',
    data: payload.data || {}, // Pass data for click handler
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click and navigation
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data;

  // Navigation logic similar to the previous implementation
  let url = '/';
  if (data.entityType === 'Booking') {
    url = `/bookings/${data.entityId}`;
  } else if (data.entityType === 'Order') {
    url = `/orders/${data.entityId}`;
  } else if (data.entityType === 'Delivery') {
    url = `/logistics/tracking/${data.code}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
