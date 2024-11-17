import React, { useState, useEffect } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeColors } from '@/themes';
import { db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  orderBy 
} from 'firebase/firestore';

interface CommunityStatsProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const CommunityStats: React.FC<CommunityStatsProps> = ({ oasisId, themeColors }) => {
  const [memberCount, setMemberCount] = useState(0);
  const [joinedToday, setJoinedToday] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    if (!oasisId) return;

    // Get start of today in user's timezone
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Listen for total posts count
    const postsRef = collection(db, 'oasis', oasisId, 'posts');
    const totalQuery = query(postsRef, orderBy('timestamp', 'desc'));
    const unsubscribeTotal = onSnapshot(totalQuery, (snapshot) => {
      setTotalPosts(snapshot.size);
    }, (error) => {
      console.error('Error fetching total posts:', error);
    });

    // Listen for member count and joined today
    const membersRef = collection(db, 'oasis', oasisId, 'members');
    const membersQuery = query(membersRef, where('status', '==', 'active'));
    const joinedTodayQuery = query(
      membersRef, 
      where('status', '==', 'active'),
      where('joinedAt', '>=', Timestamp.fromDate(startOfToday))
    );

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      setMemberCount(snapshot.size);
    }, (error) => {
      console.error('Error fetching members:', error);
    });

    const unsubscribeJoinedToday = onSnapshot(joinedTodayQuery, (snapshot) => {
      setJoinedToday(snapshot.size);
    }, (error) => {
      console.error('Error fetching joined today:', error);
    });

    // Cleanup
    return () => {
      unsubscribeTotal();
      unsubscribeMembers();
      unsubscribeJoinedToday();
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
        <CardTitle className="text-lg" style={{ color: themeColors.text }}>
          Community Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Member count */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            background: 'rgba(17, 24, 39, 0.3)',
            border: `1px solid ${themeColors.primary}`,
          }}>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg" style={{ background: `${themeColors.primary}20` }}>
                <Users className="h-4 w-4" style={{ color: themeColors.primary }} />
              </div>
              <span style={{ color: themeColors.text }}>Total Members</span>
            </div>
            <span className="font-semibold" style={{ color: themeColors.primary }}>
              {memberCount}
            </span>
          </div>

          {/* Joined Today */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            background: 'rgba(17, 24, 39, 0.3)',
            border: `1px solid ${themeColors.secondary}`,
          }}>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg" style={{ background: `${themeColors.secondary}20` }}>
                <Users className="h-4 w-4" style={{ color: themeColors.secondary }} />
              </div>
              <span style={{ color: themeColors.text }}>Joined Today</span>
            </div>
            <span className="font-semibold" style={{ color: themeColors.secondary }}>
              {joinedToday}
            </span>
          </div>

          {/* Total posts */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            background: 'rgba(17, 24, 39, 0.3)',
            border: `1px solid ${themeColors.accent}`,
          }}>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg" style={{ background: `${themeColors.accent}20` }}>
                <MessageSquare className="h-4 w-4" style={{ color: themeColors.accent }} />
              </div>
              <span style={{ color: themeColors.text }}>Total Messages</span>
            </div>
            <span className="font-semibold" style={{ color: themeColors.accent }}>
              {totalPosts}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityStats;