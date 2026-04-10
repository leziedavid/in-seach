self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/logo.png',
      badge: data.notification.badge || '/badge.png',
      vibrate: data.notification.vibrate || [100, 50, 100],
      data: data.notification.data,
      actions: data.notification.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
    
    // Jouer un son si possible (limité par les politiques des navigateurs)
    // Note: Le son est souvent géré par le système via le flag 'silent: false' implicite
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data;

  // Redirection selon le type d'entité
  let url = '/';
  if (data.entityType === 'Booking') {
    url = `/bookings/${data.entityId}`;
  } else if (data.entityType === 'Order') {
    url = `/orders/${data.entityId}`;
  } else if (data.entityType === 'Delivery') {
    url = `/logistics/tracking/${data.code}`;
  }

  event.waitUntil(
    clients.openWindow(url)
  );
});
