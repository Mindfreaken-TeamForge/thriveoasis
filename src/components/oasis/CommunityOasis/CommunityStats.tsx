import React, { useState, useEffect } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeColors } from '@/themes';
import { db, auth } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

interface CommunityStatsProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const CommunityStats: React.FC<CommunityStatsProps> = ({ oasisId, themeColors }) => {
  const [memberCount, setMemberCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [postsToday, setPostsToday] = useState(0);

  useEffect(() => {
    if (!oasisId) return;

    // Track members count
    const membersRef = collection(db, 'oasis', oasisId, 'members');
    const membersQuery = query(membersRef, where('status', '==', 'active'));
    
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const count = snapshot.docs.length;
      setMemberCount(count);
    }, (error) => {
      console.error('Error tracking members:', error);
    });

    // Track online users
    const presenceRef = collection(db, 'oasis', oasisId, 'presence');
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const presenceQuery = query(
      presenceRef,
      where('lastSeen', '>=', Timestamp.fromDate(fiveMinutesAgo))
    );
    
    const unsubscribePresence = onSnapshot(presenceQuery, (snapshot) => {
      setOnlineCount(snapshot.docs.length);
    }, (error) => {
      console.error('Error tracking presence:', error);
    });

    // Track today's posts
    const postsRef = collection(db, 'oasis', oasisId, 'posts');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const postsQuery = query(
      postsRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay))
    );
    
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPostsToday(snapshot.docs.length);
    }, (error) => {
      console.error('Error tracking posts:', error);
    });

    // Update current user's presence
    const updatePresence = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userPresenceRef = doc(presenceRef, user.uid);
      await setDoc(userPresenceRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        lastSeen: serverTimestamp()
      }, { merge: true });
    };

    // Update presence immediately and every minute
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 60000);

    // Initial member count fetch
    const fetchInitialMemberCount = async () => {
      try {
        const membersSnapshot = await getDocs(membersQuery);
        setMemberCount(membersSnapshot.docs.length);
      } catch (error) {
        console.error('Error fetching initial member count:', error);
      }
    };

    fetchInitialMemberCount();

    // Cleanup
    return () => {
      unsubscribeMembers();
      unsubscribePresence();
      unsubscribePosts();
      clearInterval(presenceInterval);
    };
  }, [oasisId]);

  return (
    <Card style={{
      background: 'rgba(17, 24, 39, 0.5)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${themeColors.accent}`,
      boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1)`,
    }}>
      <CardHeader>
        <CardTitle className="text-lg" style={{ color: themeColors.text }}>Community Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            background: 'rgba(17, 24, 39, 0.3)',
            border: `1px solid ${themeColors.secondary}`,
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ background: `${themeColors.primary}20` }}>
                <Users className="h-4 w-4" style={{ color: themeColors.primary }} />
              </div>
              <span style={{ color: themeColors.text }}>Members</span>
            </div>
            <span className="font-semibold" style={{ color: themeColors.primary }}>{memberCount.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            background: 'rgba(17, 24, 39, 0.3)',
            border: `1px solid ${themeColors.secondary}`,
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ background: `${themeColors.accent}20` }}>
                <div className="h-2 w-2 rounded-full" style={{ background: themeColors.accent }} />
              </div>
              <span style={{ color: themeColors.text }}>Online</span>
            </div>
            <span className="font-semibold" style={{ color: themeColors.accent }}>{onlineCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            background: 'rgba(17, 24, 39, 0.3)',
            border: `1px solid ${themeColors.secondary}`,
          }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ background: `${themeColors.secondary}20` }}>
                <MessageSquare className="h-4 w-4" style={{ color: themeColors.secondary }} />
              </div>
              <span style={{ color: themeColors.text }}>Posts Today</span>
            </div>
            <span className="font-semibold" style={{ color: themeColors.secondary }}>{postsToday}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityStats;