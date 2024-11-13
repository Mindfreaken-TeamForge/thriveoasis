import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, UserPlus, Crown, Link } from 'lucide-react';
import { ThemeColors } from '@/themes';
import { db } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

interface InviteAnalytics {
  totalInvites: number;
  activeInvites: number;
  totalUses: number;
  topInviters: Array<{ userId: string; invites: number }>;
}

interface InviteAnalyticsProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const InviteAnalytics: React.FC<InviteAnalyticsProps> = ({ oasisId }) => {
  const [analytics, setAnalytics] = useState<InviteAnalytics>({
    totalInvites: 0,
    activeInvites: 0,
    totalUses: 0,
    topInviters: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [oasisId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const invitesRef = collection(db, 'oasis', oasisId, 'invites');
      const invitesSnapshot = await getDocs(invitesRef);
      
      let totalUses = 0;
      let activeCount = 0;
      const inviterStats: Record<string, number> = {};

      invitesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalUses += data.currentUses || 0;
        if (data.isEnabled) activeCount++;
        
        const inviterId = data.createdBy;
        inviterStats[inviterId] = (inviterStats[inviterId] || 0) + 1;
      });

      const topInviters = Object.entries(inviterStats)
        .map(([userId, invites]) => ({ userId, invites }))
        .sort((a, b) => b.invites - a.invites)
        .slice(0, 5);

      setAnalytics({
        totalInvites: invitesSnapshot.size,
        activeInvites: activeCount,
        totalUses,
        topInviters,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Link,
      title: "Total Invites",
      value: analytics.totalInvites,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      icon: Clock,
      title: "Active Invites",
      value: analytics.activeInvites,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      icon: Users,
      title: "Total Uses",
      value: analytics.totalUses,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
      >
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-400" />
            Top Inviters
          </h3>
        </div>
        <div className="p-4">
          {analytics.topInviters.length > 0 ? (
            <div className="space-y-3">
              {analytics.topInviters.map((inviter, index) => (
                <motion.div
                  key={inviter.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${
                      index === 0 ? 'bg-yellow-500/20' :
                      index === 1 ? 'bg-gray-400/20' :
                      index === 2 ? 'bg-orange-500/20' :
                      'bg-gray-700/50'
                    } flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                      'text-gray-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{inviter.userId}</p>
                      <p className="text-sm text-gray-400">
                        {inviter.invites} {inviter.invites === 1 ? 'invite' : 'invites'}
                      </p>
                    </div>
                  </div>
                  {index === 0 && (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No inviter data available yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InviteAnalytics;