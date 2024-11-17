import { db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  Timestamp,
  increment,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

interface DailyStats {
  messageCount: number;
  lastUpdated: Date;
  date: string;
}

export class StatsService {
  private statsCache: { [key: string]: DailyStats } = {};
  private listeners: { [key: string]: () => void } = {};

  private getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  private async initializeDailyStats(oasisId: string, date: string) {
    const statsRef = doc(db, 'oasis', oasisId, 'stats', date);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
      // Initialize stats for the day
      await setDoc(statsRef, {
        messageCount: 0,
        lastUpdated: serverTimestamp(),
        date
      });
    }
  }

  async getTodayStats(oasisId: string): Promise<number> {
    const today = this.getDateString();
    
    try {
      // Initialize stats if needed
      await this.initializeDailyStats(oasisId, today);

      const statsRef = doc(db, 'oasis', oasisId, 'stats', today);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data().messageCount || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting today stats:', error);
      return 0;
    }
  }

  async incrementMessageCount(oasisId: string) {
    const today = this.getDateString();
    const statsRef = doc(db, 'oasis', oasisId, 'stats', today);

    try {
      await updateDoc(statsRef, {
        messageCount: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      // If the document doesn't exist yet, create it
      await this.initializeDailyStats(oasisId, today);
      await this.incrementMessageCount(oasisId);
    }
  }

  subscribeToTodayStats(oasisId: string, callback: (count: number) => void) {
    const today = this.getDateString();
    
    // Cleanup any existing listener for this oasisId
    if (this.listeners[oasisId]) {
      this.listeners[oasisId]();
    }

    // Initialize stats if needed
    this.initializeDailyStats(oasisId, today).then(() => {
      const statsRef = doc(db, 'oasis', oasisId, 'stats', today);
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(statsRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data().messageCount || 0);
        } else {
          callback(0);
        }
      }, (error) => {
        console.error('Error listening to today stats:', error);
        callback(0);
      });

      this.listeners[oasisId] = unsubscribe;
    });

    // Return cleanup function
    return () => {
      if (this.listeners[oasisId]) {
        this.listeners[oasisId]();
        delete this.listeners[oasisId];
      }
    };
  }

  async resetDailyStats(oasisId: string) {
    const today = this.getDateString();
    const statsRef = doc(db, 'oasis', oasisId, 'stats', today);

    try {
      await setDoc(statsRef, {
        messageCount: 0,
        lastUpdated: serverTimestamp(),
        date: today
      });
    } catch (error) {
      console.error('Error resetting daily stats:', error);
    }
  }

  // Call this when the day changes
  async handleDayChange(oasisId: string) {
    const today = this.getDateString();
    await this.initializeDailyStats(oasisId, today);
  }
}

export const statsService = new StatsService();