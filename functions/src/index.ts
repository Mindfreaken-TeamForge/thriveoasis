import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

admin.initializeApp();

const twilioClient = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);

export const sendNotification = functions.firestore
  .document('oasis/{oasisId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const { oasisId } = context.params;

    try {
      // Get all users subscribed to this oasis
      const subscriptionsSnapshot = await admin
        .firestore()
        .collectionGroup('oasisSubscriptions')
        .where('oasisId', '==', oasisId)
        .get();

      const sendPromises = subscriptionsSnapshot.docs.map(async (doc) => {
        const subscription = doc.data();
        const userId = doc.ref.parent.parent?.id;

        if (!userId) return;

        // Get user's FCM token
        const tokenDoc = await admin
          .firestore()
          .doc(`users/${userId}/tokens/fcm`)
          .get();

        if (!tokenDoc.exists) return;

        const { token } = tokenDoc.data()!;

        // Send FCM notification
        if (
          (notification.type === 'event' && subscription.events) ||
          (notification.type === 'mention' && subscription.mentions)
        ) {
          await admin.messaging().send({
            token,
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: {
              oasisId,
              type: notification.type,
            },
          });
        }

        // Send SMS if enabled (Premium feature)
        if (subscription.smsAlerts && subscription.phoneNumber) {
          await twilioClient.messages.create({
            body: `${notification.title}: ${notification.body}`,
            to: subscription.phoneNumber,
            from: functions.config().twilio.phone_number,
          });
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  });