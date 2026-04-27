import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDQnELn_IjnzPWrBlRKwB8jKJ6eQhY0vNE",
  authDomain: "djamko.firebaseapp.com",
  projectId: "djamko",
  storageBucket: "djamko.firebasestorage.app",
  messagingSenderId: "208510498449",
  appId: "1:208510498449:web:b21d9ff2e701a1bf163130",
  measurementId: "G-XRVH5Z853C"
};

// Singleton pattern for Firebase App initialization (Next.js SSR safe)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Analytics: initialized only on client side
const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

// Messaging: initialized only on client side where supported
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export { app, analytics, messaging };
