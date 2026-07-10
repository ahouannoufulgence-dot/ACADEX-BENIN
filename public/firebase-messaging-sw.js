importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCaLFckOOk4-LAWJ6FzpQaFnsmz3xAuOcE",
  authDomain: "studio-6275933280-f041b.firebaseapp.com",
  projectId: "studio-6275933280-f041b",
  storageBucket: "studio-6275933280-f041b.firebasestorage.app",
  messagingSenderId: "288475863577",
  appId: "1:288475863577:web:5738260304d5794f6f2888"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "ACADEX";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: '/icons/android-chrome-192x192.png',
    badge: '/icons/android-chrome-192x192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});