import { ref, onDisconnect, set, onValue, off, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/firebase';

export const setupPresence = (userId: string, oasisId: string) => {
  if (!userId || !oasisId) return;

  const userStatusRef = ref(rtdb, `presence/${oasisId}/${userId}`);
  const connectedRef = ref(rtdb, '.info/connected');

  // When the client's connection state changes
  const unsubscribe = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    // When user disconnects, update their status
    onDisconnect(userStatusRef).set({
      online: false,
      lastSeen: serverTimestamp()
    }).then(() => {
      // Set the user as online
      set(userStatusRef, {
        online: true,
        lastSeen: serverTimestamp()
      });
    });
  });

  // Set initial online status
  set(userStatusRef, {
    online: true,
    lastSeen: serverTimestamp()
  });

  return () => {
    off(connectedRef);
    set(userStatusRef, {
      online: false,
      lastSeen: serverTimestamp()
    });
    unsubscribe();
  };
}; 