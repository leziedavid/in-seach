importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
