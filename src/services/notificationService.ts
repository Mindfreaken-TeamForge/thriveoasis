import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Initialize Firebase Cloud Messaging
const messaging = getMessaging();

interface NotificationPreferences {
  events: boolean;
  mentions: boolean;
  smsAlerts: boolean;
  phoneNumber?: string;
}

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      // Store the FCM token in Firestore
      await setDoc(doc(db, 'users', userId, 'tokens', 'fcm'), {
        token,
        createdAt: new Date(),
      });

      return token;
    }
    throw new Error('Notification permission denied');
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

export const subscribeToOasisNotifications = async (
  userId: string,
  oasisId: string,
  preferences: NotificationPreferences
) => {
  try {
    await setDoc(
      doc(db, 'users', userId, 'oasisSubscriptions', oasisId),
      {
        ...preferences,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw error;
  }
};

export const unsubscribeFromOasisNotifications = async (
  userId: string,
  oasisId: string
) => {
  try {
    await updateDoc(doc(db, 'users', userId, 'oasisSubscriptions', oasisId), {
      events: false,
      mentions: false,
      smsAlerts: false,
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    throw error;
  }
};

export const getNotificationPreferences = async (
  userId: string,
  oasisId: string
): Promise<NotificationPreferences> => {
  try {
    const prefsDoc = await getDoc(
      doc(db, 'users', userId, 'oasisSubscriptions', oasisId)
    );
    return prefsDoc.exists()
      ? (prefsDoc.data() as NotificationPreferences)
      : {
          events: false,
          mentions: false,
          smsAlerts: false,
        };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
};

// Listen for incoming FCM messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// Send SMS notification (Premium feature)
export const sendSMSNotification = async (
  phoneNumber: string,
  message: string
) => {
  try {
    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS notification');
    }
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    throw error;
  }
};